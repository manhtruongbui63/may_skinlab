<?php

/**
 * Test Structure Validator
 * 
 * Validates tests against the standard:
 * - Feature vs Unit test location
 * - AAA pattern (Arrange → Act → Assert)
 * - Naming conventions
 * - Required assertions
 * - RefreshDatabase trait
 */

declare(strict_types=1);

class TestStructureValidator
{
    private array $errors = [];
    private array $warnings = [];

    public function validate(string $projectPath): array
    {
        $this->validateFeatureTests($projectPath);
        $this->validateUnitTests($projectPath);

        return [
            'valid' => empty($this->errors),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
        ];
    }

    private function validateFeatureTests(string $projectPath): void
    {
        $featurePath = $projectPath . '/tests/Feature';
        if (!is_dir($featurePath)) {
            return;
        }

        $tests = $this->getPhpFiles($featurePath);
        foreach ($tests as $test) {
            $content = file_get_contents($test);
            $className = basename($test, '.php');
            $relativePath = str_replace($projectPath . '/', '', $test);

            // Check class naming
            if (!str_ends_with($className, 'Test')) {
                $this->errors[] = "$relativePath: Class name must end with 'Test'";
            }

            // Check extends TestCase
            if (!preg_match('/extends\s+TestCase/', $content)) {
                $this->errors[] = "$relativePath: Must extend Tests\\TestCase";
            }

            // Check RefreshDatabase trait
            if (!preg_match('/use RefreshDatabase/', $content)) {
                $this->errors[] = "$relativePath: Feature tests must use RefreshDatabase trait";
            }

            // Check method naming
            if (preg_match('/function test_/', $content)) {
                // Good - using test_ prefix
            } else {
                $this->warnings[] = "$relativePath: Test methods should use 'test_' prefix";
            }

            // Check for AAA pattern
            if (!preg_match('/\/\/ Arrange/', $content)) {
                $this->warnings[] = "$relativePath: Add '// Arrange' comment for clarity";
            }
            if (!preg_match('/\/\/ Act/', $content)) {
                $this->warnings[] = "$relativePath: Add '// Act' comment for clarity";
            }
            if (!preg_match('/\/\/ Assert/', $content)) {
                $this->warnings[] = "$relativePath: Add '// Assert' comment for clarity";
            }

            // Check assertions
            if (!preg_match('/assertStatus\(/', $content)) {
                $this->errors[] = "$relativePath: Must assert HTTP status codes";
            }

            // Check for database assertions
            if (preg_match('/postJson|putJson|patchJson|delete/', $content) && 
                !preg_match('/assertDatabaseHas|assertDatabaseMissing/', $content)) {
                $this->warnings[] = "$relativePath: Consider asserting database state for mutation tests";
            }

            // Check for actingAs
            if (!preg_match('/actingAs\(/', $content) && 
                preg_match('/test.*unauth|test.*without.*login/i', $content) === 0) {
                $this->warnings[] = "$relativePath: Use actingAs() for authenticated tests";
            }
        }
    }

    private function validateUnitTests(string $projectPath): void
    {
        $unitPath = $projectPath . '/tests/Unit';
        if (!is_dir($unitPath)) {
            return;
        }

        $tests = $this->getPhpFiles($unitPath);
        foreach ($tests as $test) {
            $content = file_get_contents($test);
            $className = basename($test, '.php');
            $relativePath = str_replace($projectPath . '/', '', $test);

            // Check class naming
            if (!str_ends_with($className, 'Test')) {
                $this->errors[] = "$relativePath: Class name must end with 'Test'";
            }

            // Check extends TestCase
            if (!preg_match('/extends\s+TestCase/', $content)) {
                $this->errors[] = "$relativePath: Must extend Tests\\TestCase";
            }

            // Unit tests should NOT use RefreshDatabase
            if (preg_match('/use RefreshDatabase/', $content)) {
                $this->warnings[] = "$relativePath: Unit tests shouldn't use RefreshDatabase (mock dependencies)";
            }

            // Check for mocking
            if (!preg_match('/Mockery|createMock|partialMock/', $content)) {
                $this->warnings[] = "$relativePath: Consider mocking dependencies in unit tests";
            }

            // Check method naming
            if (!preg_match('/function test_/', $content)) {
                $this->warnings[] = "$relativePath: Test methods should use 'test_' prefix";
            }

            // Check for single responsibility
            $methodCount = substr_count($content, 'function test_');
            if ($methodCount > 5) {
                $this->warnings[] = "$relativePath: Consider splitting test class ($methodCount methods)";
            }
        }
    }

    private function getPhpFiles(string $directory): array
    {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }
}

// CLI Usage
if (PHP_SAPI === 'cli') {
    $path = $argv[1] ?? getcwd();
    
    echo "🧪 Validating test structure...\n";
    echo "Project path: $path\n\n";

    $validator = new TestStructureValidator();
    $result = $validator->validate($path);

    if ($result['valid']) {
        echo "✅ Test structure validation passed!\n";
    } else {
        echo "❌ Test structure validation failed:\n";
        foreach ($result['errors'] as $error) {
            echo "   - $error\n";
        }
    }

    if (!empty($result['warnings'])) {
        echo "\n⚠️  Warnings:\n";
        foreach ($result['warnings'] as $warning) {
            echo "   - $warning\n";
        }
    }

    exit($result['valid'] ? 0 : 1);
}
