<?php
declare(strict_types=1);

require_once __DIR__ . '/recipes-config.php';

const DATA_FILE = __DIR__ . '/recipes.json';

header('Content-Type: application/json; charset=utf-8');

/**
 * Remove duplicate recipe entries while preserving the first occurrence.
 *
 * @param array<int,array<string,mixed>> $recipes
 * @return array<int,array<string,mixed>>
 */
function deduplicateRecipes(array $recipes): array
{
    $seen = [];
    $deduped = [];

    foreach ($recipes as $recipe) {
        $id = $recipe['id'] ?? null;
        if (!is_string($id) || $id === '') {
            $deduped[] = $recipe;
            continue;
        }

        if (isset($seen[$id])) {
            continue;
        }

        $seen[$id] = true;
        $deduped[] = $recipe;
    }

    return $deduped;
}

/**
 * Load the current recipe collection from disk.
 *
 * @return array<int,array<string,mixed>>
 */
function loadRecipes(): array
{
    if (!file_exists(DATA_FILE)) {
        return [];
    }

    $raw = file_get_contents(DATA_FILE);
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        http_response_code(500);
        echo json_encode(['error' => 'Recipe data is corrupted.']);
        exit;
    }

    $deduped = deduplicateRecipes($decoded);
    if (count($deduped) !== count($decoded)) {
        saveRecipes($deduped);
    }

    return $deduped;
}

/**
 * Persist the recipe collection atomically.
 *
 * @param array<int,array<string,mixed>> $recipes
 */
function saveRecipes(array $recipes): void
{
    $recipes = deduplicateRecipes($recipes);

    $handle = fopen(DATA_FILE, 'c+');
    if ($handle === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Unable to open recipe storage.']);
        exit;
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        http_response_code(500);
        echo json_encode(['error' => 'Unable to lock recipe storage.']);
        exit;
    }

    $json = json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        flock($handle, LOCK_UN);
        fclose($handle);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to encode recipe data.']);
        exit;
    }

    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, $json);
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

/**
 * Normalize list input that could arrive as array or delimited string.
 *
 * @param mixed $value
 * @return array<int,string>
 */
function normalizeList(mixed $value): array
{
    if (is_array($value)) {
        $items = $value;
    } elseif (is_string($value)) {
        // Split on new lines or commas; users can paste either format.
        $items = preg_split('/[\r\n,]+/', $value);
    } else {
        return [];
    }

    $items = array_map('trim', $items);
    return array_values(array_filter($items, static fn($item) => $item !== ''));
}

/**
 * Normalize recipe source URL allowing absolute or site-relative references.
 */
function normalizeUrl(mixed $value): string
{
    $url = trim((string)$value);
    if ($url === '') {
        return '';
    }

    if (strpos($url, '/') === 0) {
        return $url;
    }

    if (filter_var($url, FILTER_VALIDATE_URL)) {
        return $url;
    }

    return '';
}

/**
 * Ensure the request body is JSON and return the decoded payload.
 *
 * @return array<string,mixed>
 */
function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON body.']);
        exit;
    }

    return $payload;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    echo json_encode(['recipes' => loadRecipes()]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$payload = readJsonBody();
$action = $payload['action'] ?? null;
$adminCode = $payload['adminCode'] ?? null;

if ($action !== 'validate' && $adminCode !== RECIPES_ADMIN_CODE) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid admin code.']);
    exit;
}

switch ($action) {
    case 'validate':
        if ($adminCode === RECIPES_ADMIN_CODE) {
            echo json_encode(['ok' => true]);
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Invalid admin code.']);
        }
        exit;

    case 'create':
        $recipeInput = $payload['recipe'] ?? null;
        if (!is_array($recipeInput)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing recipe payload.']);
            exit;
        }

        $title = trim((string)($recipeInput['title'] ?? ''));
        $instructions = trim((string)($recipeInput['instructions'] ?? ''));

        if ($title === '' || $instructions === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Title and instructions are required.']);
            exit;
        }

        $recipe = [
            'id' => $recipeInput['id'] ?? uniqid('rec_', false),
            'title' => $title,
            'ingredients' => normalizeList($recipeInput['ingredients'] ?? []),
            'categories' => normalizeList($recipeInput['categories'] ?? []),
            'creator' => trim((string)($recipeInput['creator'] ?? '')),
            'editor' => trim((string)($recipeInput['editor'] ?? '')),
            'instructions' => $instructions,
            'images' => normalizeList($recipeInput['images'] ?? []),
            'sourceUrl' => normalizeUrl($recipeInput['sourceUrl'] ?? '')
        ];

        $recipes = loadRecipes();
        $recipes[] = $recipe;
        saveRecipes($recipes);

        echo json_encode(['recipe' => $recipe]);
        exit;

    case 'update':
        $recipeInput = $payload['recipe'] ?? null;
        $id = $recipeInput['id'] ?? $payload['id'] ?? null;

        if (!is_string($id) || $id === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Missing recipe id.']);
            exit;
        }

        if (!is_array($recipeInput)) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing recipe payload.']);
            exit;
        }

        $recipes = loadRecipes();
        $found = false;
        $updatedRecipe = null;
        foreach ($recipes as $index => $existing) {
            if (($existing['id'] ?? null) === $id) {
                $updatedRecipe = [
                    'id' => $id,
                    'title' => trim((string)($recipeInput['title'] ?? $existing['title'] ?? '')),
                    'ingredients' => normalizeList($recipeInput['ingredients'] ?? $existing['ingredients'] ?? []),
                    'categories' => normalizeList($recipeInput['categories'] ?? $existing['categories'] ?? []),
                    'creator' => trim((string)($recipeInput['creator'] ?? $existing['creator'] ?? '')),
                    'editor' => trim((string)($recipeInput['editor'] ?? $existing['editor'] ?? '')),
                    'instructions' => trim((string)($recipeInput['instructions'] ?? $existing['instructions'] ?? '')),
                    'images' => normalizeList($recipeInput['images'] ?? $existing['images'] ?? []),
                    'sourceUrl' => normalizeUrl($recipeInput['sourceUrl'] ?? $existing['sourceUrl'] ?? '')
                ];
                $recipes[$index] = $updatedRecipe;
                $found = true;
                break;
            }
        }

        if (!$found) {
            http_response_code(404);
            echo json_encode(['error' => 'Recipe not found.']);
            exit;
        }

        saveRecipes($recipes);
        echo json_encode(['recipe' => $updatedRecipe]);
        exit;

    case 'delete':
        $id = $payload['id'] ?? null;
        if (!is_string($id) || $id === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Missing recipe id.']);
            exit;
        }

        $recipes = loadRecipes();
        $filtered = array_values(array_filter($recipes, static fn($recipe) => ($recipe['id'] ?? null) !== $id));

        if (count($filtered) === count($recipes)) {
            http_response_code(404);
            echo json_encode(['error' => 'Recipe not found.']);
            exit;
        }

        saveRecipes($filtered);
        echo json_encode(['deleted' => $id]);
        exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action.']);
exit;
