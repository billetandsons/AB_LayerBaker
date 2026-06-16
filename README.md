# AB_LayerBaker *(L'yer Bak'er)*

A single‑dialog Photoshop script (`AB_LayerBaker.jsx`) that exports each item in the
layer stack to its own **PNG** or **JPEG**. Unlike the built‑in *Export Layers to
Files*, it can treat a **folder/group as one composited image**, lets you control
**numbering order**, and keeps every setting in **one window**.

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/0c0b51b9-a358-4193-96c9-04e2d7830e51" width="300"/></td>
<td><img src="https://github.com/user-attachments/assets/2fd646cb-c7be-41fb-b7db-d7629c6b49b6" width="1002" /></td>
</tr>
<tr>
<td align="center"><em>Layer Window</em></td>
<td align="center"><em>Output folder result</em></td>
</tr>
</table>

---

## Features

- **Folders export as single images.** In top‑level mode, each group is rendered with
  its current contents and saved as one file — not split into a file per sub‑layer.
- **Or export every individual layer**, recursing into folders.
- **PNG or JPEG**, chosen in the dialog. PNG keeps transparency around each item;
  JPEG fills it with white. JPEG quality is selectable (0–12).
- **Numbering order** — choose whether the **top** layer is `001` or the **bottom**
  layer is `001`.
- **Custom base name**, with an option to append each layer/folder name.
- **Trim to content** (optional) crops the surrounding transparency on every export.
- **Skip hidden layers** (optional) ignores any item that was hidden when you ran the
  script — and respects folder visibility, so a layer inside a hidden group is skipped too.
- **Non‑destructive.** Layer visibility is snapshotted and restored when the run
  finishes; your document is left exactly as you found it.
- **One window for everything** — no chain of separate prompts.






---

## Installation

You don't have to install it. **File → Scripts → Browse…** will run the `.jsx` from
anywhere on disk.

To make it appear permanently under **File → Scripts**, drop `AB_LayerBaker.jsx` into
Photoshop's Scripts folder and restart:

- **macOS:** `/Applications/Adobe Photoshop <version>/Presets/Scripts/`
- **Windows:** `C:\Program Files\Adobe\Adobe Photoshop <version>\Presets\Scripts\`

Replace `<version>` with your release (e.g. `2026`). You may need admin rights to
write into that folder, and on macOS you can right‑click the Photoshop app →
*Show Package Contents* if `Presets` isn't directly visible.

---

## Usage

1. Open your document.
2. Run the script (`File → Scripts → AB_LayerBaker`, or `→ Browse…`).
3. Set the options in the dialog and click **Export**.

### Dialog options

| Option | What it does |
| --- | --- |
| **Base name** | Filename prefix. Defaults to the document name. |
| **Append each layer / folder name** | Adds the item's name after the number. Off → just `basename_01.png`. |
| **Format** | PNG or JPEG. Quality (0–12) applies to JPEG only. |
| **What to export** | *Each top‑level layer / folder* (folders rendered as one image) or *every individual layer* (recurse into folders). |
| **Numbering** | Top layer = `001`, or bottom layer = `001`. |
| **Skip hidden layers / folders** | Ignore anything that was hidden when you launched the script (a layer inside a hidden group counts as hidden). |
| **Trim to content** | Crop surrounding transparency on each export. Off keeps the full canvas so everything stays aligned. |
| **Folder** | Output location. If the folder doesn't exist you'll be prompted to create it on the spot, or cancel and pick a different path. |

Filenames are built as `basename_NN_layername.ext`, e.g. `Poster_03_Logo.png`.

---

## Comparison with native *File → Export → Layers to Files*

Photoshop ships its own *Export Layers to Files* script. It's capable and supports
more file formats, but it was built to export **individual layers**, which makes a few
common jobs awkward. Here's how the two line up:

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/d74ff3c4-8eb1-4a53-ba03-3cb18609fff7" width="500"/></td>
<td><img src="https://github.com/user-attachments/assets/8daa2a56-7f76-47b3-b85c-7cddd528ab48" width="500"/></td>
</tr>
<tr>
<td align="center"><em>The other guys</em></td>
<td align="center"><em>AB_LayerBaker Dialogue box</em></td>
</tr>
</table>

| | This script | Native *Export Layers to Files* |
| --- | --- | --- |
| **Export a folder/group as one merged image** | ✅ Yes (top‑level mode) | ❌ No — every layer becomes its own file; group/folder structure is flattened into a single output folder |
| **Export every individual layer** | ✅ Yes (recurse mode) | ✅ Yes |
| **Choose numbering direction** (top vs bottom = `001`) | ✅ Yes | ❌ No — always auto‑numbered, direction not configurable |
| **Drop the auto number from filenames** | Number is always shown, but layer name is optional | ❌ A four‑digit number is always inserted (a safety against same‑named layers); removing it means editing Adobe's script |
| **Formats** | PNG, JPEG | PSD, TIFF, PDF, BMP, Targa, GIF, PNG‑8, PNG‑24, JPEG |
| **Trim to content** | ✅ Both formats | ⚠️ Available, but only for certain formats and historically inconsistent |
| **Skip hidden layers** | ✅ *Skip hidden layers / folders* checkbox (respects folder visibility) | ✅ *Visible Layers Only* checkbox |
| **One consolidated settings dialog** | ✅ Yes | ✅ Yes |
| **Leaves the document untouched** | ✅ Restores visibility afterward | ✅ Works on internal copies |
| **Maintained by** | You | Adobe (official) |

**Use this script when** you organise work into folders and want one image per
folder, or you care about numbering order and clean filenames.

**Use the native script when** you need a format this one doesn't output (PSD, TIFF,
PDF, etc.) or a built‑in "visible layers only" filter.

---

## Notes & caveats

- **JPEG has no transparency** — empty areas flatten to white. Use **PNG** to keep
  transparency.
- **Locked Background layer:** some Photoshop versions won't let a Background layer be
  hidden, so it may appear in exports where it shouldn't. Convert it to a normal layer
  first (double‑click it in the Layers panel).
- **Output folder doesn't have to exist.** If you type a path that isn't on disk the script asks if you want to create it. Confirm and it's made for you; cancel and you're back to fixing the path. Use the Browse button to avoid typos altogether. (Unlike the native *Export Layers to Files*, which warns and stops with no offer to create.)
- **Numbering is always present** in filenames. Turn off *Append layer name* if you
  want short `basename_NN` names.
- In **top‑level mode**, a folder is rendered using the *current* visibility of its
  sub‑layers — hidden sub‑layers stay hidden, which is usually what you want.

---

## License

_Add your license here (e.g. MIT)._
