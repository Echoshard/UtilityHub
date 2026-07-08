# Simple Family Recipes Public

A lightweight, self-hosted recipe management system designed for families to store, share, and print their favorite recipes. 

This project is built with vanilla PHP and Javascript, using a flat-file JSON database. It requires no complex database setup (like MySQL), making it perfect for simple hosting.



## Features

- **📖 Catalog View**: Clean, responsive grid layout to browse all recipes.
- **🔍 Advanced Search**: Filter recipes quickly by **Ingredients** (e.g., *chicken, garlic*) or **Categories** (e.g., *Dinner, Italian*).
- **📝 Admin Mode**: "Admin Mode" protected by a simple passcode to Add, Edit, and Delete recipes.
- **⚡ Mass Editor**: A dedicated bulk editor (`massedit.php`) for managing the entire recipe database in a spreadsheet-like view.
- **📸 Image Support**: Upload and attach photos to your recipes.
- **🖨️ Printer Friendly**: Optimized CSS for printing individual recipes or the entire collection to PDF.
- **⚡ Lightweight**: Stores data in `recipes.json`. No external database required.
- **📱 Responsive**: Works great on mobile devices and tablets.

## Requirements

- PHP 8.0 or higher.
- A web server (Apache, Nginx, or similar).
- Write permissions on the project directory (for uploading images and saving `recipes.json`).

## How to Install

1.  **Download & Extract:**
    Download the project files or clone the repository.
    ```bash
    git clone https://github.com/yourusername/simple-family-recipes.git
    ```

2.  **Configure:**
    Open `recipes-config.php` in any text editor (like Notepad).
    *   **RECIPES_ADMIN_CODE**: Change `'CODE'` to your desired secret passcode.
    *   **RECIPES_SITE_TITLE**: Change `'Family Recipes'` to your family name.

    ```php
    const RECIPES_ADMIN_CODE = 'mySecretCode123';
    const RECIPES_SITE_TITLE = 'Smith Family Kitchen';
    ```

3.  **Upload:**
    Upload all files to your web host using **FTP** or your hosting control panel.
    *   *Note: If you are running this on a local server, just place the files in your web root.*

4.  **Set Permissions:**
    For the system to work, it needs to be able to save new recipes and images.
    Ensure your web server has **write access** to:
    *   The `images` folder (create it if it doesn't exist).
    *   The `recipes.json` file.

    *On most web hosts, you can right-click the folder in your FTP client and set Permissions to 755 or 777.*

## Usage

### Browsing (Public)
Visitors can view all recipes, search by ingredients, and print recipes. The interface is read-only by default.

### Managing Recipes (Admin)
1.  Click the **"Enter Admin Code"** button in the top right.
2.  Type the code you set in `recipes-config.php`.
3.  Once authenticated, you will see **"Add Recipe"** and **"Edit"** buttons.

### Mass Editing
For heavy-duty editing, maintainers can navigate to `massedit.php` (e.g. `yourwebsite.com/massedit.php`).
This provides a spreadsheet-like interface where you can quickly edit titles, ingredients, and potential metadata for multiple recipes at once. You will need your Admin Code to save changes.

### Backup
Since standard JSON files are used for storage, backing up is as simple as downloading `recipes.json` and the `images/` folder to your computer.

## ⚠️ Security Disclaimer

This application is designed for **convenience and simplicity**, not high-grade security.
*   The **Admin Code** mechanism is basic and prevents casual editing, but it is not enterprise-level security.
*   It is intended for use by a trusted group (e.g., a family) on a private network or a basic shared hosting environment.
*   **Do not** use this application to store sensitive data.

## License

MIT License. Feel free to modify and use for your own family!
