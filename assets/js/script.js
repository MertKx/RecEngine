document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element Selection ---
    const recipeGrid = document.getElementById('recipe-results');
    const searchInput = document.getElementById('ingredient-input');
    const pillContainer = document.getElementById('ingredient-pills');
    const clearBtn = document.getElementById('clear-filters');
    const guideBtn = document.getElementById('guide-btn');
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-button');

    // --- State Management ---
    let allRecipes = []; 
    let selectedIngredients = new Set(); 

    // --- 1. Data Fetching ---
    fetch('assets/data/recipes.json')
        .then(response => {
            if (!response.ok) throw new Error("JSON file could not be loaded!");
            return response.json();
        })
        .then(data => {
            allRecipes = data;
            generateIngredientPills(data); 
            displayRecipes(allRecipes);   
        })
        .catch(error => {
            console.error('Error:', error);
            if(recipeGrid) recipeGrid.innerHTML = `<p class="no-results">Error: ${error.message}</p>`;
        });

    // --- 2. Dynamic Ingredient Pill Generation ---
    function generateIngredientPills(recipes) {
        if (!pillContainer) return;
        const allIngs = new Set();
        
        // Extract unique ingredients from all recipes
        recipes.forEach(r => {
            r.ingredients.forEach(ing => {
                allIngs.add(ing.trim().toLowerCase());
            });
        });
        
        pillContainer.innerHTML = ''; 
        Array.from(allIngs).sort().forEach(ing => {
            const pill = document.createElement('div');
            pill.className = 'pill';
            pill.textContent = ing;
            
            pill.onclick = () => {
                if (selectedIngredients.has(ing)) {
                    selectedIngredients.delete(ing);
                    pill.classList.remove('selected');
                } else {
                    selectedIngredients.add(ing);
                    pill.classList.add('selected');
                }
                filterRecipes(); 
            };
            pillContainer.appendChild(pill);
        });
    }

    // --- 3. Filtering Logic (Multi-Select & Search) ---
    function filterRecipes() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        
        const filteredRecipes = allRecipes.filter(recipe => {
            const recipeIngs = recipe.ingredients.map(i => i.trim().toLowerCase());
            
            // AND Logic: Check if EVERY selected ingredient exists in the recipe
            const matchesPills = Array.from(selectedIngredients).every(sel => 
                recipeIngs.includes(sel)
            );

            // Search Logic: Match name or individual ingredients
            const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) || 
                                  recipeIngs.some(ing => ing.includes(searchTerm));

            return matchesPills && matchesSearch;
        });

        displayRecipes(filteredRecipes);
    }

    // --- 4. Render Recipe Cards ---
    function displayRecipes(recipes) {
        if (!recipeGrid) return;
        recipeGrid.innerHTML = ''; 

        if (recipes.length === 0) {
            recipeGrid.innerHTML = `<p class="no-results">No matches found.</p>`;
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = `recipe-card difficulty-${recipe.difficulty}`;
            card.onclick = () => openModal(recipe);

            card.innerHTML = `
                <span class="time-tag">⏱ ${recipe.time}</span>
                <h3>${recipe.name}</h3>
                <div class="ingredients-label">Ingredients</div>
                <p class="ingredients-list">${recipe.ingredients.join(', ')}</p>
                <p style="color: #888; font-size: 0.8rem; margin-top: 10px; font-weight: 600;">Click to see instructions...</p>
            `;
            recipeGrid.appendChild(card);
        });
    }

    // --- 5. Modal Operations ---
    function openModal(recipe) {
        if (!modal || !modalBody) return;
        modalBody.innerHTML = `
            <span class="time-tag" style="display:inline-block; margin-bottom:10px;">⏱ ${recipe.time}</span>
            <h2>${recipe.name}</h2>
            <hr style="margin-bottom:15px; border: 0.5px solid #eee;">
            <h4 class="ingredients-label">Ingredients:</h4>
            <p style="font-style: italic; margin-bottom: 20px;">${recipe.ingredients.join(', ')}</p>
            <h4 class="ingredients-label">Instructions:</h4>
            <p style="line-height: 1.8;">${recipe.instructions}</p>
        `;
        modal.style.display = "block";
    }

    // Close modal on button click or outside click
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { 
        if (event.target == modal) modal.style.display = "none"; 
    };

    // --- 6. Event Listeners ---

    // Reset all filters
    if (clearBtn) {
        clearBtn.onclick = () => {
            selectedIngredients.clear();
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
            filterRecipes();
        };
    }

    // Show app guide
    if (guideBtn) {
        guideBtn.onclick = () => {
            if (!modalBody) return;
            modalBody.innerHTML = `
                <h2 style="margin-bottom: 15px;">How to Use Smart RecEngine? 🍳</h2>
                <div style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
                    <p><strong>1. Select:</strong> Click the ingredient pills you have at home.</p>
                    <p><strong>2. Filter:</strong> The app will automatically find recipes matching your selection.</p>
                    <p><strong>3. Details:</strong> Click any card to see full instructions.</p>
                    <p style="padding: 10px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--medium-color);">
                        <strong>Difficulty Tip:</strong> Colored lines indicate effort. Red is Hard, Green is Easy.
                    </p>
                    <p>For source code: <a href="https://github.com/MertKx/RecEngine" target="_blank">https://github.com/MertKx/RecEngine</a></p>
                </div>
                <p style="margin-top:25px; font-size:0.85rem; color: #636e72;">RecEngine Project by Mert Kalay © 2026</p>
            `;
            modal.style.display = "block";
        };
    }

    if (searchInput) searchInput.oninput = filterRecipes;
});
