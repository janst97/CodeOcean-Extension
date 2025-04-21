# VS Code Codeocean Extension

This Codeocean extension is used to perform Codeocean assessments inside your VS Code IDE.

---

## 🔍 Assessment Instructions

To complete a Codeocean assessment in **VS Code**, follow these steps:

1. **Download the Exercise**  
   Download the assessment from the Codeocean platform. This will give you a `.zip` file.

2. **Unzip and Open in VS Code**  
   Unzip the file and open the extracted folder **at the root** in VS Code.

3. **Complete the Exercise**  
   Do your work as instructed within the files provided.

4. **Run the Assessment**  
   Open the **Command Palette** using:
   - `Cmd + Shift + P` (macOS)
   - `Ctrl + Shift + P` (Windows/Linux)  
   Then run the command:  
   **`Codeocean Assess`**

---

## ⚙️ Installing the Extension (Bundled Version)

If you are not installing from the VS Code Marketplace and want to use the bundled extension directly:

1. **Locate the `.vsix` File**  
   Download or copy the `codeocean-extension-0.0.1.vsix` file from the root of this repo or your distribution.

2. **Install the Extension in VS Code**
   - Open VS Code
   - Open the Command Palette:  
     `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (others)
   - Choose **Extensions: Install from VSIX**
   - Select the `.vsix` file

   Alternatively, install via terminal:

   ```bash
   code --install-extension codeocean-extension-0.0.1.vsix
