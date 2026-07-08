(() => {
    const state = {
        recipes: [],
        filtered: [],
        searchMode: 'ingredients',
        activeRecipe: null,
        categoryCounts: {},
        fileHandle: null
    };

    const elements = {
        recipesGrid: document.getElementById('recipesGrid'),
        searchInput: document.getElementById('searchInput'),
        searchModeButtons: document.querySelectorAll('.search-mode button'),
        addRecipeButton: document.getElementById('addRecipeButton'),
        saveRecipesButton: document.getElementById('saveRecipesButton'),
        recipesJsonLoader: document.getElementById('recipesJsonLoader'),
        
        modalBackdrop: document.getElementById('modalBackdrop'),
        recipeForm: document.getElementById('recipeForm'),
        recipeFormTitle: document.getElementById('recipeFormTitle'),
        formError: document.getElementById('formError'),
        cancelFormButton: document.getElementById('cancelFormButton'),
        cardTemplate: document.getElementById('recipeCardTemplate'),
        
        viewerBackdrop: document.getElementById('viewerBackdrop'),
        viewerTitle: document.getElementById('viewerTitle'),
        viewerCreator: document.getElementById('viewerCreator'),
        viewerEditor: document.getElementById('viewerEditor'),
        viewerSource: document.getElementById('viewerSource'),
        viewerSourceLink: document.getElementById('viewerSourceLink'),
        viewerSourceDomain: document.getElementById('viewerSourceDomain'),
        viewerCategories: document.getElementById('viewerCategories'),
        viewerIngredients: document.getElementById('viewerIngredients'),
        viewerInstructions: document.getElementById('viewerInstructions'),
        closeViewerButton: document.getElementById('closeViewerButton'),
        printRecipeButton: document.getElementById('printRecipeButton'),
        editRecipeButton: document.getElementById('editRecipeButton'),
        deleteRecipeButton: document.getElementById('deleteRecipeButton'),
        
        sourceUrlInput: document.querySelector('input[name="sourceUrl"]'),
        categorySuggestions: document.getElementById('categorySuggestions'),
        printContainer: document.getElementById('printContainer'),
        printAllButton: document.getElementById('printAllButton')
    };

    document.addEventListener('DOMContentLoaded', () => {
        bindEvents();
        setSearchMode(state.searchMode);
        initRecipesData();
        window.addEventListener('keydown', handleGlobalKeydown);
    });

    function bindEvents() {
        elements.searchInput.addEventListener('input', filterRecipes);
        elements.searchModeButtons.forEach(button => {
            button.addEventListener('click', () => {
                setSearchMode(button.dataset.mode);
                filterRecipes();
            });
        });

        elements.addRecipeButton.addEventListener('click', () => openRecipeForm());
        elements.cancelFormButton.addEventListener('click', closeRecipeForm);
        elements.closeViewerButton.addEventListener('click', closeRecipeViewer);
        elements.printRecipeButton.addEventListener('click', printActiveRecipe);
        
        elements.editRecipeButton.addEventListener('click', () => {
            const activeRecipe = state.activeRecipe;
            if (!activeRecipe) return;
            closeRecipeViewer();
            openRecipeForm(activeRecipe);
        });

        elements.deleteRecipeButton.addEventListener('click', () => {
            if (!state.activeRecipe) return;
            confirmDeleteRecipe(state.activeRecipe);
        });

        elements.viewerBackdrop.addEventListener('click', (event) => {
            if (event.target === elements.viewerBackdrop) {
                closeRecipeViewer();
            }
        });

        // Local JSON Loader Input
        elements.recipesJsonLoader.addEventListener('change', handleImportJson);

        // Save JSON Button
        elements.saveRecipesButton.addEventListener('click', saveRecipesToFile);

        // Form Submit
        elements.recipeForm.addEventListener('submit', handleFormSubmit);

        // Print All Button
        if (elements.printAllButton) {
            elements.printAllButton.addEventListener('click', printAllRecipes);
        }

        // Click category suggestions
        elements.categorySuggestions.addEventListener('click', handleCategorySuggestionClick);
    }

    // Initialize local data or fetch default recipes.json
    async function initRecipesData() {
        const cached = localStorage.getItem('familyRecipesData');
        if (cached) {
            try {
                state.recipes = JSON.parse(cached);
                state.categoryCounts = computeCategoryCounts(state.recipes);
                filterRecipes();
                return;
            } catch (e) {
                console.warn('Corrupted local storage recipes, loading default.', e);
            }
        }
        await loadDefaultRecipes();
    }

    async function loadDefaultRecipes() {
        try {
            const response = await fetch('recipes.json');
            if (response.ok) {
                const data = await response.json();
                state.recipes = Array.isArray(data) ? data : (data.recipes || []);
                localStorage.setItem('familyRecipesData', JSON.stringify(state.recipes));
            }
        } catch (e) {
            console.warn('Unable to load default recipes.json file.', e);
        }
        state.categoryCounts = computeCategoryCounts(state.recipes);
        filterRecipes();
    }

    // File System Loading
    function handleImportJson(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                state.recipes = Array.isArray(data) ? data : (data.recipes || []);
                localStorage.setItem('familyRecipesData', JSON.stringify(state.recipes));
                state.categoryCounts = computeCategoryCounts(state.recipes);
                filterRecipes();
                window.alert(`Successfully loaded ${state.recipes.length} recipes!`);
            } catch (err) {
                window.alert('Error parsing recipes.json file. Make sure it is valid JSON.');
            }
        };
        reader.readAsText(file);
        elements.recipesJsonLoader.value = '';
    }

    // File System Export (Download)
    function saveRecipesToFile() {
        const dataStr = JSON.stringify(state.recipes, null, 4);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recipes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Form Handling (Create / Update)
    function handleFormSubmit(event) {
        event.preventDefault();
        clearFormError();

        const formData = new FormData(elements.recipeForm);
        const id = formData.get('id') || null;

        const recipeData = {
            id: id || Date.now().toString(),
            title: formData.get('title')?.trim(),
            creator: formData.get('creator')?.trim(),
            editor: formData.get('editor')?.trim(),
            sourceUrl: formData.get('sourceUrl')?.trim(),
            categories: parseFormList(formData.get('categories')),
            ingredients: parseFormList(formData.get('ingredients')),
            instructions: formData.get('instructions')?.trim()
        };

        if (!recipeData.title || !recipeData.instructions) {
            showFormError('Title and instructions are required.');
            return;
        }

        if (id) {
            // Edit existing recipe
            const index = state.recipes.findIndex(r => r.id === id);
            if (index !== -1) {
                state.recipes[index] = recipeData;
            } else {
                state.recipes.push(recipeData);
            }
        } else {
            // Add new recipe
            state.recipes.push(recipeData);
        }

        localStorage.setItem('familyRecipesData', JSON.stringify(state.recipes));
        state.categoryCounts = computeCategoryCounts(state.recipes);
        filterRecipes();
        closeRecipeForm();
    }

    function parseFormList(str) {
        if (!str) return [];
        return str.split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
    }

    function confirmDeleteRecipe(recipe) {
        if (!recipe || !recipe.id) return;
        const confirmed = window.confirm(`Delete "${recipe.title}"? This cannot be undone.`);
        if (!confirmed) return;

        state.recipes = state.recipes.filter(r => r.id !== recipe.id);
        localStorage.setItem('familyRecipesData', JSON.stringify(state.recipes));
        state.categoryCounts = computeCategoryCounts(state.recipes);
        
        if (state.activeRecipe?.id === recipe.id) {
            closeRecipeViewer();
        }
        
        filterRecipes();
    }

    // Search and filtering
    function setSearchMode(mode) {
        if (!mode) return;
        state.searchMode = mode;
        elements.searchModeButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.mode === mode);
        });
    }

    function filterRecipes() {
        const query = elements.searchInput.value.trim().toLowerCase();
        const mode = state.searchMode;
        const seen = new Set();

        state.filtered = state.recipes.filter(recipe => {
            if (!query) {
                if (recipe?.id) {
                    if (seen.has(recipe.id)) return false;
                    seen.add(recipe.id);
                }
                return true;
            }

            const searchFields = [];
            if (mode === 'ingredients') {
                const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
                searchFields.push(...ingredients);
                searchFields.push(recipe.title ?? '');
            } else {
                const categories = Array.isArray(recipe.categories) ? recipe.categories : [];
                searchFields.push(...categories);
            }

            const matches = searchFields
                .map(item => String(item ?? '').trim())
                .filter(Boolean)
                .some(item => item.toLowerCase().includes(query));

            if (!matches) return false;

            if (recipe?.id) {
                if (seen.has(recipe.id)) return false;
                seen.add(recipe.id);
            }
            return true;
        });

        renderRecipes();
        updateCategorySuggestions();
    }

    function renderRecipes() {
        const container = elements.recipesGrid;
        container.innerHTML = '';

        if (state.filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">No recipes match that search. Try another ingredient or category.</div>';
            return;
        }

        state.filtered.forEach(recipe => {
            const fragment = elements.cardTemplate.content.cloneNode(true);
            const card = fragment.querySelector('.recipe-card');
            const title = fragment.querySelector('h2');
            const meta = fragment.querySelector('.recipe-meta');
            const linkContainer = fragment.querySelector('.recipe-link');
            const linkAnchor = linkContainer?.querySelector('a');
            const linkDomain = linkContainer?.querySelector('small');
            const categories = fragment.querySelector('.categories');
            const ingredientsList = fragment.querySelector('.ingredients ul');
            const instructionsBody = fragment.querySelector('.instruction-body');
            const editButton = fragment.querySelector('.edit-button');
            const deleteButton = fragment.querySelector('.delete-button');

            title.textContent = recipe.title ?? 'Untitled Recipe';

            const creator = recipe.creator ? `<span class="meta-line"><strong>Creator:</strong> ${escapeHtml(recipe.creator)}</span>` : '';
            const editor = recipe.editor ? `<span class="meta-line"><strong>Editor:</strong> ${escapeHtml(recipe.editor)}</span>` : '';
            meta.innerHTML = [creator, editor].filter(Boolean).join('<br>');
            meta.classList.toggle('hidden', meta.textContent.trim() === '');

            if (linkContainer && linkAnchor) {
                const sourceUrl = typeof recipe.sourceUrl === 'string' ? recipe.sourceUrl.trim() : '';
                if (sourceUrl) {
                    linkContainer.classList.remove('hidden');
                    linkAnchor.href = sourceUrl;
                    linkAnchor.textContent = 'View Website';
                    linkAnchor.title = sourceUrl;
                    linkAnchor.addEventListener('click', event => event.stopPropagation());
                    if (linkDomain) linkDomain.textContent = linkLabel(sourceUrl);
                } else {
                    linkContainer.classList.add('hidden');
                }
            }

            categories.innerHTML = '';
            if (Array.isArray(recipe.categories) && recipe.categories.length) {
                recipe.categories.forEach(category => {
                    const pill = document.createElement('span');
                    pill.className = 'pill';
                    pill.textContent = category;
                    categories.appendChild(pill);
                });
            }

            ingredientsList.innerHTML = '';
            if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
                recipe.ingredients.forEach(ingredient => {
                    const li = document.createElement('li');
                    li.textContent = ingredient;
                    ingredientsList.appendChild(li);
                });
            } else {
                ingredientsList.innerHTML = '<li>No ingredients listed yet.</li>';
            }

            instructionsBody.innerHTML = '';
            if (typeof recipe.instructions === 'string' && recipe.instructions.trim()) {
                recipe.instructions.split(/\n{2,}/).forEach(section => {
                    const paragraph = document.createElement('p');
                    paragraph.textContent = section.replace(/\n/g, ' ');
                    instructionsBody.appendChild(paragraph);
                });
            } else {
                instructionsBody.innerHTML = '<p>Instructions coming soon.</p>';
            }

            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open details for ${recipe.title}`);
            card.addEventListener('click', () => openRecipeViewer(recipe));

            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openRecipeViewer(recipe);
                }
            });

            editButton.addEventListener('click', (event) => {
                event.stopPropagation();
                openRecipeForm(recipe);
            });
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                confirmDeleteRecipe(recipe);
            });

            container.appendChild(fragment);
        });
    }

    function openRecipeViewer(recipe) {
        state.activeRecipe = recipe;
        document.body.classList.add('no-scroll');

        elements.viewerTitle.textContent = recipe.title ?? 'Untitled Recipe';
        elements.viewerCreator.textContent = recipe.creator ? `Creator: ${recipe.creator}` : '';
        elements.viewerCreator.classList.toggle('hidden', !recipe.creator);
        elements.viewerEditor.textContent = recipe.editor ? `Editor: ${recipe.editor}` : '';
        elements.viewerEditor.classList.toggle('hidden', !recipe.editor);

        const sourceUrl = typeof recipe.sourceUrl === 'string' ? recipe.sourceUrl.trim() : '';
        if (sourceUrl) {
            elements.viewerSource.classList.remove('hidden');
            elements.viewerSourceLink.href = sourceUrl;
            elements.viewerSourceLink.title = sourceUrl;
            elements.viewerSourceDomain.textContent = linkLabel(sourceUrl);
        } else {
            elements.viewerSource.classList.add('hidden');
        }

        elements.viewerCategories.innerHTML = '';
        if (Array.isArray(recipe.categories) && recipe.categories.length) {
            elements.viewerCategories.classList.remove('hidden');
            recipe.categories.forEach(category => {
                const pill = document.createElement('span');
                pill.className = 'viewer-pill';
                pill.textContent = category;
                elements.viewerCategories.appendChild(pill);
            });
        } else {
            elements.viewerCategories.classList.add('hidden');
        }

        elements.viewerIngredients.innerHTML = '';
        if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
            recipe.ingredients.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                elements.viewerIngredients.appendChild(li);
            });
        } else {
            elements.viewerIngredients.innerHTML = '<li>No ingredients listed yet.</li>';
        }

        elements.viewerInstructions.innerHTML = '';
        if (typeof recipe.instructions === 'string' && recipe.instructions.trim()) {
            recipe.instructions.trim().split(/\n{2,}/).forEach(section => {
                const paragraph = document.createElement('p');
                paragraph.textContent = section.replace(/\n/g, ' ');
                elements.viewerInstructions.appendChild(paragraph);
            });
        } else {
            elements.viewerInstructions.innerHTML = '<p>Instructions coming soon.</p>';
        }

        elements.viewerBackdrop.classList.remove('hidden');
    }

    function closeRecipeViewer() {
        elements.viewerBackdrop.classList.add('hidden');
        document.body.classList.remove('no-scroll');
        state.activeRecipe = null;
    }

    function openRecipeForm(recipe = null) {
        elements.recipeForm.reset();
        clearFormError();
        elements.recipeFormTitle.textContent = recipe ? 'Edit Recipe' : 'Add Recipe';
        elements.recipeForm.querySelector('button[type="submit"]').textContent = recipe ? 'Update Recipe' : 'Save Recipe';

        if (recipe) {
            elements.recipeForm.elements.title.value = recipe.title ?? '';
            elements.recipeForm.elements.creator.value = recipe.creator ?? '';
            if (elements.sourceUrlInput) {
                elements.sourceUrlInput.value = recipe.sourceUrl ?? '';
            }
            elements.recipeForm.elements.editor.value = recipe.editor ?? '';
            elements.recipeForm.elements.categories.value = (recipe.categories ?? []).join('\n');
            elements.recipeForm.elements.ingredients.value = (recipe.ingredients ?? []).join('\n');
            elements.recipeForm.elements.instructions.value = recipe.instructions ?? '';
            elements.recipeForm.elements.id.value = recipe.id ?? '';
        } else {
            elements.recipeForm.elements.id.value = '';
            if (elements.sourceUrlInput) {
                elements.sourceUrlInput.value = '';
            }
        }

        elements.modalBackdrop.classList.remove('hidden');
    }

    function closeRecipeForm() {
        elements.modalBackdrop.classList.add('hidden');
    }

    function showFormError(message) {
        elements.formError.textContent = message;
        elements.formError.classList.remove('hidden');
    }

    function clearFormError() {
        elements.formError.textContent = '';
        elements.formError.classList.add('hidden');
    }

    function computeCategoryCounts(recipes) {
        const counts = {};
        const seen = new Set();
        recipes.forEach(recipe => {
            const id = recipe?.id;
            if (id && seen.has(id)) return;
            if (id) seen.add(id);
            const categories = Array.isArray(recipe.categories) ? recipe.categories : [];
            categories.forEach(category => {
                const trimmed = String(category).trim();
                if (trimmed) counts[trimmed] = (counts[trimmed] ?? 0) + 1;
            });
        });
        return counts;
    }

    function updateCategorySuggestions() {
        const container = elements.categorySuggestions;
        if (!container) return;

        if (state.searchMode !== 'categories') {
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }

        const entries = Object.entries(state.categoryCounts ?? {});
        if (!entries.length) {
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }

        const query = elements.searchInput.value.trim().toLowerCase();
        const filtered = entries
            .filter(([name]) => !query || name.toLowerCase().includes(query))
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

        container.innerHTML = '';

        if (!filtered.length) {
            container.innerHTML = '<p class="image-hint">No categories match that search yet.</p>';
            container.classList.remove('hidden');
            return;
        }

        filtered.forEach(([name, count]) => {
            const suggestion = document.createElement('div');
            suggestion.className = 'category-suggestion';
            suggestion.setAttribute('role', 'listitem');
            suggestion.tabIndex = 0;
            suggestion.dataset.category = name;

            const nameNode = document.createElement('span');
            nameNode.className = 'category-name';
            nameNode.textContent = name;

            const countNode = document.createElement('span');
            countNode.className = 'category-count';
            countNode.textContent = ` (${count})`;

            suggestion.appendChild(nameNode);
            suggestion.appendChild(countNode);
            container.appendChild(suggestion);
        });
        container.classList.remove('hidden');
    }

    function handleCategorySuggestionClick(event) {
        const target = event.target.closest('.category-suggestion');
        if (target && target.dataset.category) {
            applyCategorySuggestion(target.dataset.category);
        }
    }

    function applyCategorySuggestion(category) {
        elements.searchInput.value = category;
        filterRecipes();
    }

    function printActiveRecipe() {
        if (!state.activeRecipe) return;
        elements.printContainer.innerHTML = `<article class="print-recipe">${renderRecipeToPrintStr(state.activeRecipe)}</article>`;
        window.print();
    }

    function printAllRecipes() {
        elements.printContainer.innerHTML = '';
        const sorted = [...state.recipes].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        sorted.forEach(recipe => {
            const article = document.createElement('article');
            article.className = 'print-recipe';
            article.innerHTML = renderRecipeToPrintStr(recipe);
            elements.printContainer.appendChild(article);
        });
        window.print();
    }

    function renderRecipeToPrintStr(recipe) {
        const categories = Array.isArray(recipe.categories) ? recipe.categories.join(', ') : '';
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i => `<li>${i}</li>`).join('') : '';
        const instructions = (recipe.instructions || '').split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');

        return `
            <h2>${recipe.title}</h2>
            <div class="meta">
                ${recipe.creator ? `From: ${recipe.creator}` : ''}
                ${recipe.creator && categories ? ' | ' : ''}
                ${categories ? `Categories: ${categories}` : ''}
            </div>
            ${ingredients ? `<div class="section-title">Ingredients</div><ul>${ingredients}</ul>` : ''}
            ${instructions ? `<div class="section-title">Instructions</div><div>${instructions}</div>` : ''}
        `;
    }

    function handleGlobalKeydown(event) {
        if (event.key === 'Escape') {
            if (!elements.viewerBackdrop.classList.contains('hidden')) {
                closeRecipeViewer();
            } else if (!elements.modalBackdrop.classList.contains('hidden')) {
                closeRecipeForm();
            }
        }
    }

    function linkLabel(url) {
        try {
            const parsed = new URL(url);
            return parsed.hostname.replace(/^www\./, '');
        } catch (e) {
            return url;
        }
    }

    function escapeHtml(value) {
        const span = document.createElement('span');
        span.textContent = value;
        return span.innerHTML;
    }
})();
