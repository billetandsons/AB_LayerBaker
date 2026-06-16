#target photoshop

/*
 * AB_LayerBaker (L'yer Bak'er)
 * --------------------------------
 * Saves one PNG or JPEG per item in the layer stack, with only that item
 * visible. Everything is configured in a single dialog.
 *
 * Run with a document open:  File > Scripts > Browse...
 * (or drop this .jsx onto Photoshop)
 */

(function () {

    if (app.documents.length === 0) {
        alert("Open a document first, then run this script.");
        return;
    }

    var doc = app.activeDocument;

    // sensible defaults
    var defaultFolderPath = "";
    try { if (doc.path) { defaultFolderPath = doc.path.fsName; } } catch (e) {}
    var defaultName = doc.name.replace(/\.[^\.]+$/, "");

    // ============================== DIALOG ==============================
    var dlg = new Window("dialog", "AB_LayerBaker");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 10;
    dlg.margins = 16;

    // --- Base name ---
    var nameGrp = dlg.add("group");
    nameGrp.add("statictext", undefined, "Base name:");
    var nameInput = nameGrp.add("edittext", undefined, defaultName);
    nameInput.characters = 26;

    // checkbox + prefix/suffix radios on one row
    var nameOptGrp = dlg.add("group");
    nameOptGrp.orientation = "row";
    nameOptGrp.alignChildren = ["left", "center"];
    var useLayerNamesCb = nameOptGrp.add("checkbox", undefined, "Include layer / folder name as:");
    useLayerNamesCb.value = true;
    var rbSuffix = nameOptGrp.add("radiobutton", undefined, "Suffix");
    var rbPrefix = nameOptGrp.add("radiobutton", undefined, "Prefix");
    rbSuffix.value = true; // default: basename_NN_LayerName

    function syncNameOpts() {
        rbSuffix.enabled = useLayerNamesCb.value;
        rbPrefix.enabled = useLayerNamesCb.value;
    }
    useLayerNamesCb.onClick = syncNameOpts;
    syncNameOpts();

    // --- Format ---
    var fmtPanel = dlg.add("panel", undefined, "Format");
    fmtPanel.orientation = "row";
    fmtPanel.alignChildren = ["left", "center"];
    fmtPanel.margins = 12;
    var rbJpeg = fmtPanel.add("radiobutton", undefined, "JPEG");
    var rbPng  = fmtPanel.add("radiobutton", undefined, "PNG");
    rbJpeg.value = true;
    var qLabel = fmtPanel.add("statictext", undefined, "    Quality:");
    var qualityDd = fmtPanel.add("dropdownlist", undefined,
        ["12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "0"]);
    qualityDd.selection = 0;

    function syncFormat() {
        var isJpeg = rbJpeg.value;
        qualityDd.enabled = isJpeg;
        qLabel.enabled = isJpeg;
    }
    rbJpeg.onClick = syncFormat;
    rbPng.onClick = syncFormat;

    // --- Scope ---
    var scopePanel = dlg.add("panel", undefined, "What to export");
    scopePanel.orientation = "column";
    scopePanel.alignChildren = ["left", "top"];
    scopePanel.margins = 12;
    var rbTop = scopePanel.add("radiobutton", undefined, "Each top-level layer / folder");
    var rbAll = scopePanel.add("radiobutton", undefined, "Every individual layer (recurse into folders)");
    rbTop.value = true;

    // --- Numbering order ---
    var numPanel = dlg.add("panel", undefined, "Numbering");
    numPanel.orientation = "column";
    numPanel.alignChildren = ["left", "top"];
    numPanel.margins = 12;
    var rbTopNum = numPanel.add("radiobutton", undefined, "Top layer = 001");
    var rbBotNum = numPanel.add("radiobutton", undefined, "Bottom layer = 001");
    rbTopNum.value = true;

    // --- Skip hidden ---
    var skipHiddenCb = dlg.add("checkbox", undefined, "Skip hidden layers / folders");

    // --- Trim ---
    var trimCb = dlg.add("checkbox", undefined, "Trim to content (crop surrounding transparency)");

    // --- Output folder ---
    var outGrp = dlg.add("group");
    outGrp.add("statictext", undefined, "Folder:");
    var folderInput = outGrp.add("edittext", undefined, defaultFolderPath);
    folderInput.characters = 24;
    var browseBtn = outGrp.add("button", undefined, "Browse\u2026");
    browseBtn.onClick = function () {
        var start = folderInput.text ? new Folder(folderInput.text) : Folder.desktop;
        var f = start.selectDlg("Choose output folder");
        if (f) { folderInput.text = f.fsName; }
    };

    // --- Buttons ---
    var btnGrp = dlg.add("group");
    btnGrp.alignment = "right";
    btnGrp.add("button", undefined, "Cancel", { name: "cancel" });
    btnGrp.add("button", undefined, "Export", { name: "ok" });

    syncFormat();
    if (dlg.show() !== 1) { return; } // cancelled

    // ============================ SETTINGS ============================
    var baseName     = sanitize(nameInput.text);
    var useLayerName = useLayerNamesCb.value;
    var nameAsPrefix = rbPrefix.value;   // true = LayerName_NN_basename, false = basename_NN_LayerName
    var format       = rbJpeg.value ? "jpg" : "png";
    var jpegQuality  = parseInt(qualityDd.selection.text, 10);
    var exportNested = rbAll.value;
    var fromBottom   = rbBotNum.value;
    var skipHidden   = skipHiddenCb.value;
    var trimToLayer  = trimCb.value;
    var folderPath   = folderInput.text;

    if (!folderPath) { alert("Please choose an output folder."); return; }
    var outputFolder = new Folder(folderPath);
    if (!outputFolder.exists) {
        var confirm = Window.confirm(
            "This folder doesn\'t exist yet:\n" + folderPath + "\n\nCreate it now?",
            false,
            "Folder Not Found"
        );
        if (!confirm) { return; }
        if (!outputFolder.create()) {
            alert("Couldn\'t create the folder. Check permissions and try again.\n\n" + folderPath);
            return;
        }
    }

    // ============================= EXPORT =============================
    var originalUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    var allLayers = [];
    collectAllLayers(doc, allLayers);
    var snapshot = [];
    for (var s = 0; s < allLayers.length; s++) { snapshot.push(allLayers[s].visible); }

    var targets = [];
    if (exportNested) {
        for (var a = 0; a < allLayers.length; a++) {
            if (allLayers[a].typename !== "ArtLayer") { continue; }
            if (skipHidden && !isEffectivelyVisible(allLayers[a])) { continue; }
            targets.push(allLayers[a]);
        }
    } else {
        for (var b = 0; b < doc.layers.length; b++) {
            if (skipHidden && !doc.layers[b].visible) { continue; }
            targets.push(doc.layers[b]);
        }
    }
    if (targets.length === 0) {
        alert(skipHidden ? "Nothing to export (all items are hidden)." : "Nothing to export.");
        app.preferences.rulerUnits = originalUnits;
        return;
    }

    // doc.layers[0] is the TOP of the stack, so targets are top-first by default.
    // Numbering from the bottom just reverses which item gets 001.
    if (fromBottom) { targets.reverse(); }

    // save options
    var jpg = new JPEGSaveOptions();
    jpg.quality = jpegQuality;
    jpg.embedColorProfile = true;
    jpg.formatOptions = FormatOptions.STANDARDBASELINE;
    jpg.matte = MatteType.NONE;

    var png = new PNGSaveOptions();
    png.compression = 6;   // 0-9
    png.interlaced = false;

    var options = (format === "jpg") ? jpg : png;

    var padW = String(targets.length).length; if (padW < 2) { padW = 2; }
    var count = 0, errors = [];

    for (var t = 0; t < targets.length; t++) {
        var item = targets[t];
        try {
            isolate(item, exportNested, allLayers, doc);

            var fileName = buildName(baseName, useLayerName, nameAsPrefix, item.name, t + 1, padW, format);
            var outFile  = new File(outputFolder.fsName + "/" + fileName);

            if (trimToLayer) {
                var work = doc.duplicate("tmp_export", false);
                try { work.trim(TrimType.TRANSPARENT, true, true, true, true); } catch (e) {}
                if (format === "jpg") { work.flatten(); }
                work.saveAs(outFile, options, true, Extension.LOWERCASE);
                work.close(SaveOptions.DONOTSAVECHANGES);
            } else {
                doc.saveAs(outFile, options, true, Extension.LOWERCASE);
            }
            count++;
        } catch (err) {
            errors.push(item.name + ": " + err);
        }
    }

    // restore document
    for (var r = 0; r < allLayers.length; r++) {
        try { allLayers[r].visible = snapshot[r]; } catch (e) {}
    }
    app.preferences.rulerUnits = originalUnits;

    var msg = "Exported " + count + " " + format.toUpperCase() +
              " file" + (count === 1 ? "" : "s") + " to:\n" + outputFolder.fsName;
    if (errors.length) { msg += "\n\nSkipped " + errors.length + ":\n" + errors.join("\n"); }
    alert(msg);


    // ============================= HELPERS ============================
    function collectAllLayers(container, arr) {
        for (var i = 0; i < container.layers.length; i++) {
            var lyr = container.layers[i];
            arr.push(lyr);
            if (lyr.typename === "LayerSet") { collectAllLayers(lyr, arr); }
        }
    }

    function isEffectivelyVisible(layer) {
        if (!layer.visible) { return false; }
        var parent = layer.parent;
        while (parent && parent.typename === "LayerSet") {
            if (!parent.visible) { return false; }
            parent = parent.parent;
        }
        return true;
    }

    function isolate(item, nested, all, document) {
        if (nested) {
            for (var i = 0; i < all.length; i++) { all[i].visible = false; }
            item.visible = true;
            var parent = item.parent;
            while (parent && parent.typename === "LayerSet") {
                parent.visible = true;
                parent = parent.parent;
            }
        } else {
            for (var j = 0; j < document.layers.length; j++) {
                document.layers[j].visible = (document.layers[j] === item);
            }
        }
    }

    function buildName(base, withLayer, layerAsPrefix, layerName, index, width, ext) {
        var num = pad(index, width);
        var ln  = withLayer ? sanitize(layerName) : "";

        var parts = [];
        if (withLayer && layerAsPrefix && ln !== "") {
            // LayerName_NN_basename  or  LayerName_NN  (if no base)
            parts.push(ln);
            parts.push(num);
            if (base !== "") { parts.push(base); }
        } else {
            // basename_NN_LayerName  or  basename_NN  (default / suffix)
            if (base !== "") { parts.push(base); }
            parts.push(num);
            if (withLayer && ln !== "") { parts.push(ln); }
        }
        return parts.join("_") + "." + ext;
    }

    function sanitize(s) {
        return String(s).replace(/[\\\/:\*\?"<>\|]/g, "_").replace(/\s+/g, "_");
    }

    function pad(n, width) {
        var str = String(n);
        while (str.length < width) { str = "0" + str; }
        return str;
    }

})();
