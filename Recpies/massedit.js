
        const state = {
            recipes: [],
            filtered: [],
            adminCode: localStorage.getItem('familyRecipesAdminCode') ?? '',
            saving: new Set()
        };

        const elements = {
            adminCodeInput: document.getElementById('adminCodeInput'),
            searchInput: document.getElementById('searchInput'),
            saveAllButton: document.getElementById('saveAllButton'),
            addRecipeButton: document.getElementById('addRecipeButton'),
            reloadButton: document.getElementById('reloadButton'),
            statusMessage: document.getElementById('statusMessage'),
            tableBody: document.getElementById('recipesTableBody'),
            rowTemplate: document.getElementById('recipeRowTemplate')
        };

        document.addEventListener('DOMContentLoaded', () => {
            if (elements.adminCodeInput && state.adminCode) {
                elements.adminCodeInput.value = state.adminCode;
            }
            bindEvents();
            loadRecipes();
        });

        function bindEvents() {
            elements.saveAllButton.addEventListener('click', handleSaveAll);
            elements.addRecipeButton.addEventListener('click', handleAddRecipe);
            elements.reloadButton.addEventListener('click', () => loadRecipes(true));
            elements.searchInput.addEventListener('input', handleSearchInput);
        }

        async function handleSaveAll() {
            const dirtyRows = Array.from(elements.tableBody.querySelectorAll('tr.dirty'));
            if (!dirtyRows.length) return;

            let savedCount = 0;
            let errorCount = 0;

            for (const row of dirtyRows) {
                const id = row.dataset.id;
                // Find original recipe for fallback, or use empty object for new ones
                const original = state.recipes.find(r => r.id === id) || {};
                
                try {
                    await saveRow(row, original);
                    // If row is no longer dirty, it was saved successfully
                    if (!row.classList.contains('dirty')) {
                        savedCount++;
                    } else {
                        errorCount++;
                    }
                } catch (e) {
                    errorCount++;
                }
            }

            if (errorCount === 0) {
                updateStatus(`All ${savedCount} changes saved.`, 'success');
            } else {
                updateStatus(`Saved ${savedCount} recipes; ${errorCount} failed.`, 'error');
            }
        }

        function updateSaveAllButtonState() {
             if (!elements.saveAllButton) return;
             const anyDirty = elements.tableBody.querySelector('tr.dirty');
             elements.saveAllButton.disabled = !anyDirty;
        }

        function handleAddRecipe() {
            // Remove empty state if present
            const emptyState = elements.tableBody.querySelector('.empty-state');
            if (emptyState) {
                elements.tableBody.innerHTML = '';
            }

            const newRecipe = {
                title: '',
                creator: 'Family Collection',
                editor: '',
                categories: [],
                ingredients: [],
                instructions: '',
                sourceUrl: '',
                images: []
            };
            
            const row = createTableRow(newRecipe);
            // Mark as dirty immediately so it can be saved
            markRowDirty(row);
            // Ensure save button is enabled
            row.querySelector('.save-button').disabled = false;
            
            elements.tableBody.prepend(row);
            row.querySelector('input').focus();
            updateStatus('New recipe added. Fill in details and save.', 'success');
            updateSaveAllButtonState();
        }

        function handleSearchInput() {
            const query = elements.searchInput.value.trim().toLowerCase();
            if (!query) {
                state.filtered = state.recipes.slice();
            } else {
                state.filtered = state.recipes.filter((recipe) => {
                    const haystack = [
                        recipe.title,
                        recipe.creator,
                        recipe.editor,
                        Array.isArray(recipe.categories) ? recipe.categories.join(' ') : recipe.categories,
                        Array.isArray(recipe.ingredients) ? recipe.ingredients.join(' ') : recipe.ingredients
                    ].map((value) => typeof value === 'string' ? value.toLowerCase() : '').join(' ');
                    return haystack.includes(query);
                });
            }
            renderTable();
        }

        async function loadRecipes(force = false) {
            if (!force && state.recipes.length) {
                return;
            }

            updateStatus('Loading recipes…');
            elements.tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">Loading recipes…</td></tr>';

            try {
                const response = await fetch('recipes-api.php');
                if (!response.ok) {
                    throw new Error('Unable to load recipes.');
                }
                const payload = await response.json();
                state.recipes = Array.isArray(payload.recipes) ? payload.recipes : [];
                state.filtered = state.recipes.slice();
                if (!state.recipes.length) {
                    elements.tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No recipes found.</td></tr>';
                    updateStatus('No recipes available yet.');
                    return;
                }
                renderTable();
                updateStatus(`${state.recipes.length} recipes loaded.`, 'success');
            } catch (error) {
                console.error(error);
                elements.tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">Failed to load recipes.</td></tr>';
                updateStatus(error.message ?? 'Failed to load recipes.', 'error');
            }
        }

        function renderTable() {
            if (!state.filtered.length) {
                elements.tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No recipes match that search.</td></tr>';
                return;
            }

            const fragment = document.createDocumentFragment();
            state.filtered.forEach((recipe) => {
                const row = createTableRow(recipe);
                fragment.appendChild(row);
            });
            elements.tableBody.innerHTML = '';
            elements.tableBody.appendChild(fragment);
        }

        function createTableRow(recipe) {
            const { content } = elements.rowTemplate;
            const row = content.firstElementChild.cloneNode(true);
            row.dataset.id = recipe.id ?? '';

            const fieldMap = {
                title: recipe.title ?? '',
                creator: recipe.creator ?? '',
                editor: recipe.editor ?? '',
                categories: Array.isArray(recipe.categories) ? recipe.categories.join('\n') : (recipe.categories ?? ''),
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : (recipe.ingredients ?? ''),
                instructions: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n\n') : (recipe.instructions ?? ''),
                sourceUrl: recipe.sourceUrl ?? '',
                images: Array.isArray(recipe.images) ? recipe.images.join('\n') : (recipe.images ?? '')
            };

            Object.entries(fieldMap).forEach(([field, value]) => {
                const cell = row.querySelector(`[data-field="${field}"]`);
                if (!cell) {
                    return;
                }
                const input = cell.querySelector('input, textarea');
                if (!input) {
                    return;
                }
                input.value = value;
                input.addEventListener('input', () => markRowDirty(row));
            });

            const saveButton = row.querySelector('.save-button');
            const resetButton = row.querySelector('.reset-button');
            const deleteButton = row.querySelector('.delete-button');

            saveButton.addEventListener('click', () => saveRow(row, recipe));
            resetButton.addEventListener('click', () => resetRow(row, fieldMap));
            deleteButton.addEventListener('click', () => deleteRow(row, recipe));

            row.dataset.baseline = JSON.stringify(fieldMap);
            return row;
        }

        function collectRowValues(row) {
            const values = {};
            row.querySelectorAll('td[data-field]').forEach((cell) => {
                const field = cell.dataset.field;
                const input = cell.querySelector('input, textarea');
                if (!input) {
                    return;
                }
                values[field] = input.value ?? '';
            });
            return values;
        }

        function markRowDirty(row) {
            const baseline = JSON.parse(row.dataset.baseline ?? '{}');
            const current = collectRowValues(row);
            const dirty = Object.keys(baseline).some((key) => (baseline[key] ?? '') !== (current[key] ?? ''));
            row.classList.toggle('dirty', dirty);

            const saveButton = row.querySelector('.save-button');
            const resetButton = row.querySelector('.reset-button');
            saveButton.disabled = !dirty || state.saving.has(row.dataset.id);
            resetButton.disabled = !dirty || state.saving.has(row.dataset.id);
            updateSaveAllButtonState();
        }

        function resetRow(row, baselineMap) {
            Object.entries(baselineMap).forEach(([field, value]) => {
                const cell = row.querySelector(`[data-field="${field}"]`);
                if (!cell) {
                    return;
                }
                const input = cell.querySelector('input, textarea');
                if (input) {
                    input.value = value;
                }
            });
            markRowDirty(row);
        }

        async function saveRow(row, originalRecipe) {
            const adminCode = (elements.adminCodeInput.value || '').trim();
            if (!adminCode) {
                updateStatus('Admin code required to save changes.', 'error');
                elements.adminCodeInput.focus();
                return;
            }

            const recipeId = row.dataset.id;
            const currentValues = collectRowValues(row);
            const payload = {
                id: recipeId, // Allow empty ID for new recipes
                title: currentValues.title.trim(),
                creator: currentValues.creator.trim(),
                editor: currentValues.editor.trim(),
                sourceUrl: currentValues.sourceUrl.trim(),
                categories: currentValues.categories,
                ingredients: currentValues.ingredients,
                instructions: currentValues.instructions,
                images: currentValues.images
            };

            if (!payload.title || !payload.instructions) {
                updateStatus('Title and instructions are required.', 'error');
                return;
            }

            state.saving.add(recipeId);
            markRowDirty(row);
            setRowDisabledState(row, true);
            updateStatus(`Saving “${payload.title}”…`);

            try {
                const response = await fetch('recipes-api.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: recipeId ? 'update' : 'create',
                        adminCode,
                        recipe: payload
                    })
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(result.error ?? 'Unable to save recipe.');
                }

                const savedRecipe = result.recipe ?? originalRecipe;
                localStorage.setItem('familyRecipesAdminCode', adminCode);
                state.adminCode = adminCode;
                elements.adminCodeInput.value = adminCode;

                const baselineMap = {
                    title: savedRecipe.title ?? payload.title,
                    creator: savedRecipe.creator ?? payload.creator,
                    editor: savedRecipe.editor ?? payload.editor,
                    categories: Array.isArray(savedRecipe.categories) ? savedRecipe.categories.join('\n') : (savedRecipe.categories ?? payload.categories),
                    ingredients: Array.isArray(savedRecipe.ingredients) ? savedRecipe.ingredients.join('\n') : (savedRecipe.ingredients ?? payload.ingredients),
                    instructions: savedRecipe.instructions ?? payload.instructions,
                    sourceUrl: savedRecipe.sourceUrl ?? payload.sourceUrl,
                    images: Array.isArray(savedRecipe.images) ? savedRecipe.images.join('\n') : (savedRecipe.images ?? payload.images)
                };
                
                row.dataset.baseline = JSON.stringify(baselineMap);
                resetRow(row, baselineMap);

                // Update in-memory recipe
                if (recipeId) {
                    const index = state.recipes.findIndex((recipe) => recipe.id === recipeId);
                    if (index !== -1) {
                        state.recipes[index] = savedRecipe;
                    }
                } else {
                    // It was a new recipe
                    savedRecipe.id = result.recipe.id; // Ensure ID is set from result
                    row.dataset.id = savedRecipe.id;
                    state.recipes.push(savedRecipe);
                }
                updateStatus(`Saved “${baselineMap.title || 'recipe'}”.`, 'success');
            } catch (error) {
                console.error(error);
                updateStatus(error.message ?? 'Failed to save recipe.', 'error');
            } finally {
                state.saving.delete(recipeId);
                setRowDisabledState(row, false);
                markRowDirty(row);
                updateSaveAllButtonState();
            }
        }

        async function deleteRow(row, recipe) {
            const adminCode = (elements.adminCodeInput.value || '').trim();
            if (!adminCode) {
                updateStatus('Admin code required to delete recipes.', 'error');
                elements.adminCodeInput.focus();
                return;
            }

            if (!confirm(`Are you sure you want to delete “${recipe.title || 'this recipe'}”? This cannot be undone.`)) {
                return;
            }

            const recipeId = row.dataset.id;
            
            // If it's a new unsaved row (no ID), just remove from DOM
            if (!recipeId) {
                row.remove();
                updateStatus('Unsaved recipe removed.', 'success');
                updateSaveAllButtonState();
                if (elements.tableBody.children.length === 0) {
                     elements.tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No recipes found.</td></tr>';
                }
                return;
            }

            setRowDisabledState(row, true);
            updateStatus(`Deleting “${recipe.title}”…`);

            try {
                const response = await fetch('recipes-api.php', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: 'delete',
                        adminCode,
                        id: recipeId
                    })
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(result.error ?? 'Unable to delete recipe.');
                }

                state.recipes = state.recipes.filter(r => r.id !== recipeId);
                state.filtered = state.filtered.filter(r => r.id !== recipeId);
                
                row.remove();
                updateStatus(`Deleted “${recipe.title}”.`, 'success');
                
                if (elements.tableBody.children.length === 0) {
                     elements.tableBody.innerHTML = '<tr><td colspan="9" class="empty-state">No recipes found.</td></tr>';
                }
            } catch (error) {
                console.error(error);
                updateStatus(error.message ?? 'Failed to delete recipe.', 'error');
                setRowDisabledState(row, false);
            }
        }

        function setRowDisabledState(row, disabled) {
            row.querySelectorAll('input, textarea, button').forEach((element) => {
                element.disabled = disabled;
            });
        }

        function updateStatus(message, tone = '') {
            elements.statusMessage.textContent = message;
            elements.statusMessage.classList.remove('success', 'error');
            if (tone) {
                elements.statusMessage.classList.add(tone);
            }
        }
    