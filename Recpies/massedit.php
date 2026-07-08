<?php
declare(strict_types=1);

require_once __DIR__ . '/recipes-config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars(RECIPES_SITE_TITLE) ?> - Mass Edit</title>
    <style>
        :root {
            color-scheme: dark;
            font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --accent: #f28c60;
            --accent-muted: rgba(242, 140, 96, 0.18);
            --accent-strong: #ff9f73;
            --bg: #0f0b0a;
            --surface: #1b1413;
            --surface-elevated: #231917;
            --surface-outline: rgba(255, 255, 255, 0.08);
            --text: #f4ece6;
            --text-muted: #b7a7a0;
            --danger: #ff9388;
            --layout-max: 1560px;
            --row-height: 3.4rem;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            background: var(--bg);
            color: var(--text);
        }

        a {
            color: var(--accent-strong);
        }

        .page {
            width: min(var(--layout-max), 100%);
            margin: 0 auto;
            padding: 2rem 1.5rem 3rem;
            display: grid;
            gap: 1.5rem;
        }

        header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }

        header h1 {
            margin: 0;
            font-size: clamp(1.6rem, 2.6vw, 2.1rem);
            font-weight: 600;
        }

        .header-actions {
            display: inline-flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .button {
            border: none;
            border-radius: 999px;
            padding: 0.55rem 1.4rem;
            background: var(--accent);
            color: #fff;
            cursor: pointer;
            transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            text-decoration: none;
        }

        .button.secondary {
            background: rgba(242, 140, 96, 0.12);
            border: 1px solid rgba(242, 140, 96, 0.32);
            color: var(--accent-strong);
        }

        .button:disabled {
            opacity: 0.55;
            cursor: not-allowed;
        }

        .button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 10px 24px rgba(242, 140, 96, 0.35);
        }

        main {
            display: grid;
            gap: 1.5rem;
        }

        .toolbar {
            display: grid;
            gap: 1rem;
            background: var(--surface);
            border-radius: 18px;
            border: 1px solid var(--surface-outline);
            padding: 1.25rem 1.5rem;
        }

        .toolbar-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }

        .toolbar label {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
            font-weight: 600;
            flex: 1 1 260px;
        }

        .toolbar input[type="password"],
        .toolbar input[type="search"],
        .toolbar input[type="text"] {
            padding: 0.55rem 0.9rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.06);
            color: var(--text);
        }

        .toolbar small {
            color: var(--text-muted);
            font-weight: 400;
        }

        .status-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: space-between;
            align-items: center;
            font-size: 0.95rem;
        }

        .status-message {
            color: var(--text-muted);
        }

        .status-message.success {
            color: var(--accent-strong);
        }

        .status-message.error {
            color: var(--danger);
        }

        table {
            width: 100%;
            min-width: 1500px;
            border-collapse: collapse;
            background: var(--surface);
            border-radius: 18px;
            border: 1px solid var(--surface-outline);
            overflow: hidden;
            table-layout: auto;
        }

        thead th {
            text-align: left;
            padding: 0.9rem;
            background: rgba(255, 255, 255, 0.04);
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-muted);
            border-bottom: 1px solid var(--surface-outline);
        }

        tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: background 0.12s ease;
        }

        tbody tr:hover {
            background: rgba(242, 140, 96, 0.08);
        }

        tbody tr.dirty {
            box-shadow: inset 3px 0 0 var(--accent);
        }

        td {
            padding: 0.75rem;
            vertical-align: top;
        }

        td .cell-input,
        td textarea {
            width: 100%;
            min-width: 0;
        }

        .cell-input {
            padding: 0.5rem 0.7rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.04);
            color: inherit;
        }

        .cell-input:focus,
        textarea:focus {
            outline: 2px solid rgba(242, 140, 96, 0.45);
            border-color: rgba(242, 140, 96, 0.45);
        }

        textarea {
            padding: 0.55rem 0.7rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            background: rgba(255, 255, 255, 0.04);
            color: inherit;
            resize: vertical;
            min-height: 80px;
        }

        .actions {
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            align-items: flex-start;
        }

        .actions .button {
            padding: 0.45rem 1.1rem;
        }

        .actions .button.secondary {
            border-color: rgba(255, 255, 255, 0.12);
        }

        .empty-state {
            text-align: center;
            padding: 3rem 1.5rem;
            color: var(--text-muted);
        }

        .table-wrapper {
            overflow-x: auto;
        }

        @media (max-width: 1024px) {
            table {
                min-width: 1200px;
            }
        }

        @media (max-width: 720px) {
            .toolbar {
                padding: 1rem;
            }

            .toolbar label {
                flex: 1 1 100%;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <header>
            <h1><?= htmlspecialchars(RECIPES_SITE_TITLE) ?> - Mass Edit</h1>
            <div class="header-actions">
                <a href="index.php" class="button secondary">Back to Library</a>
            </div>
        </header>

        <main>
            <section class="toolbar">
                <div class="toolbar-row">
                    <label>
                        Admin Code
                        <input type="password" id="adminCodeInput" autocomplete="current-password" placeholder="Required to save changes">
                        <small>The code is stored locally after a successful save.</small>
                    </label>
                    <label>
                        Search
                        <input type="search" id="searchInput" placeholder="Filter by title, creator, editor, categories...">
                    </label>
                </div>
                <div class="status-bar">
                    <p id="statusMessage" class="status-message">Load recipes to begin editing.</p>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="button" id="saveAllButton" class="button" disabled>Save All</button>
                        <button type="button" id="addRecipeButton" class="button">Add Recipe</button>
                        <button type="button" id="reloadButton" class="button secondary">Reload Recipes</button>
                    </div>
                </div>
            </section>

            <section>
                <div class="table-wrapper">
                    <table aria-describedby="statusMessage">
                        <thead>
                            <tr>
                                <th scope="col">Title</th>
                                <th scope="col">Creator</th>
                                <th scope="col">Editor</th>
                                <th scope="col">Categories</th>
                                <th scope="col">Ingredients</th>
                                <th scope="col">Instructions</th>
                                <th scope="col">Source URL</th>
                                <th scope="col">Images</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="recipesTableBody">
                            <tr>
                                <td colspan="9" class="empty-state">Loading recipes…</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>

    <template id="recipeRowTemplate">
        <tr>
            <td data-field="title"><input class="cell-input" type="text"></td>
            <td data-field="creator"><input class="cell-input" type="text"></td>
            <td data-field="editor"><input class="cell-input" type="text"></td>
            <td data-field="categories"><textarea rows="3"></textarea></td>
            <td data-field="ingredients"><textarea rows="3"></textarea></td>
            <td data-field="instructions"><textarea rows="3"></textarea></td>
            <td data-field="sourceUrl"><input class="cell-input" type="url" placeholder="https://example.com"></td>
            <td data-field="images"><textarea rows="2" placeholder="One path or URL per line"></textarea></td>
            <td class="actions">
                <button type="button" class="button save-button" disabled>Save</button>
                <button type="button" class="button secondary reset-button" disabled>Reset</button>
                <button type="button" class="button secondary delete-button" style="margin-top: 0.5rem; width: 100%; border-color: var(--danger); color: var(--danger);">Delete</button>
            </td>
        </tr>
    </template>

    <script src="massedit.js"></script>
</body>
</html>
