<?php
declare(strict_types=1);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php require_once __DIR__ . '/recipes-config.php'; ?>
<title><?= htmlspecialchars(RECIPES_SITE_TITLE) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="print.css" media="print">
</head>
<body>
    <div class="page">
        <header>
            <h1><?= htmlspecialchars(RECIPES_SITE_TITLE) ?></h1>
            <div class="header-actions">
                <button id="adminModeButton" class="button secondary">Enter Admin Code</button>
                <button id="printAllButton" class="button secondary" title="Print all recipes as PDF">Download All</button>
                <button id="addRecipeButton" class="button hidden">Add Recipe</button>
            </div>
        </header>

        <section class="controls">
            <div class="search-bar">
                <input type="search" id="searchInput" placeholder="Search recipes..." aria-label="Search recipes">
                <div class="search-mode" role="group" aria-label="Select search mode">
                    <button type="button" data-mode="ingredients" class="active">Ingredients</button>
                    <button type="button" data-mode="categories">Categories</button>
                </div>
            </div>
            <div id="categorySuggestions" class="category-suggestions hidden" role="list" aria-label="Category suggestions"></div>
        </section>

        <div class="content-area">
            <section id="recipesArea">
                <div id="recipesGrid" class="recipes-grid" aria-live="polite"></div>
            </section>
        </div>
    </div>

    <div id="printContainer"></div>
    <div id="modalBackdrop" class="modal-backdrop hidden" role="dialog" aria-modal="true">
        <form id="recipeForm" class="modal" autocomplete="off">
            <h2 id="recipeFormTitle">Add Recipe</h2>
            <div class="form-grid two-column">
                <label class="full-width">
                    Title
                    <input type="text" name="title" required>
                </label>
                <label>
                    Creator
                    <input type="text" name="creator" placeholder="Who originally shared the recipe?">
                </label>
                <label>
                    Editor
                    <input type="text" name="editor" placeholder="Who last edited the recipe?">
                </label>
                <label class="full-width">
                    Website URL
                    <input type="url" name="sourceUrl" placeholder="https://example.com/family-favorite" inputmode="url">
                </label>
                <label class="full-width">
                    Categories
                    <textarea name="categories" class="compact" rows="3" placeholder="Comma or newline separated (e.g. Dinner, Italian)"></textarea>
                </label>
                <label class="full-width">
                    Ingredients
                    <textarea name="ingredients" rows="6" placeholder="One item per line"></textarea>
                </label>
                <label class="full-width">
                    Instructions
                    <textarea name="instructions" class="tall" rows="8" required placeholder="Step by step directions"></textarea>
                </label>
                <div class="image-field full-width">
                    <header>
                        <span>Recipe Photos</span>
                    </header>
                    <div class="image-upload-controls">
                        <input type="file" id="imageUploadInput" accept="image/*" multiple>
                    </div>
                    <div class="image-upload-list" id="imageUploadList" role="list"></div>
                    <input type="hidden" name="images" id="imageListInput" value="">
                </div>
                <p id="adminStatusHint" class="form-hint admin-hint full-width hidden"></p>
                <input type="hidden" name="adminCode" id="adminCodeInput" value="">
                <p id="formError" class="form-error hidden full-width"></p>
            </div>
            <div class="form-actions">
                <button type="button" id="cancelFormButton" class="button secondary">Cancel</button>
                <button type="submit" class="button">Save Recipe</button>
            </div>
            <input type="hidden" name="id">
        </form>
    </div>

    <div id="viewerBackdrop" class="viewer-backdrop hidden" role="dialog" aria-modal="true">
        <article class="viewer-modal" aria-labelledby="viewerTitle">
            <header class="viewer-header">
                <h2 id="viewerTitle">Recipe Title</h2>
                <div class="viewer-actions">
                    <button type="button" id="editRecipeButton" class="button secondary hidden">Edit Recipe</button>
                    <button type="button" id="deleteRecipeButton" class="button danger hidden">Delete Recipe</button>
                    <button type="button" id="printRecipeButton" class="button secondary print-visible">Print Recipe</button>
                    <button type="button" id="closeViewerButton" class="button secondary">Close</button>
                </div>
            </header>
            <div class="viewer-meta">
                <p id="viewerCreator"></p>
                <p id="viewerEditor"></p>
            </div>
            <div class="viewer-source hidden" id="viewerSource">
                <a href="#" id="viewerSourceLink" target="_blank" rel="noopener">Open Website</a>
                <small id="viewerSourceDomain"></small>
            </div>
            <div class="viewer-categories" id="viewerCategories"></div>
            <section class="viewer-section">
                <h3>Ingredients</h3>
                <ul id="viewerIngredients"></ul>
            </section>
            <section class="viewer-section">
                <h3>Instructions</h3>
                <div id="viewerInstructions"></div>
            </section>
            <section class="viewer-section hidden" id="viewerImagesSection">
                <h3>Gallery</h3>
                <div class="viewer-images" id="viewerImages"></div>
            </section>
        </article>
    </div>

    <div id="imageLightboxBackdrop" class="image-lightbox-backdrop hidden" role="dialog" aria-modal="true">
        <figure class="image-lightbox">
            <img id="imageLightboxImage" src="" alt="">
            <figcaption id="imageLightboxCaption"></figcaption>
            <button type="button" id="closeImageLightboxButton" class="button secondary">Close</button>
        </figure>
    </div>

    <template id="recipeCardTemplate">
        <article class="recipe-card">
            <h2></h2>
            <div class="recipe-meta"></div>
            <div class="recipe-link hidden">
                <a href="#" target="_blank" rel="noopener">View Website</a>
                <small></small>
            </div>
            <div class="categories"></div>
            <div class="ingredients">
                <strong>Ingredients</strong>
                <ul></ul>
            </div>
            <div class="instructions">
                <strong>Instructions</strong>
                <div class="instruction-body"></div>
            </div>
            <div class="images hidden">
                <strong>Images</strong>
                <div class="images-grid"></div>
            </div>
            <div class="card-actions hidden">
                <button type="button" class="button secondary edit-button">Edit</button>
                <button type="button" class="button danger delete-button">Delete</button>
            </div>
        </article>
    </template>

    <script src="app.js"></script>
</body>
</html>
