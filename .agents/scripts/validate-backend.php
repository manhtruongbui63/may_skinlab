<?php

/**
 * Backend Code Validator
 *
 * Gộp tất cả các validator:
 * - API Structure (Routes, Controllers, Services, DTOs, Resources, FormRequests)
 * - Command Structure (Artisan Commands)
 * - Database Structure (Migrations, Models, Enums, Factories)
 * - Job Structure (Background Jobs)
 * - Test Structure (Feature/Unit Tests)
 * - Master Data Structure (Driver, Registry)
 *
 * Usage: php validate-backend.php <project-path>
 * Example: php validate-backend.php backend
 */

declare(strict_types=1);

// =============================================================================
// SECTION 1: API Structure Validator
// =============================================================================

class ApiStructureValidator
{
    private array $errors = [];
    private array $warnings = [];
    private int $controllerCount = 0;
    private int $serviceCount = 0;
    private int $requestCount = 0;
    private int $resourceCount = 0;

    public function validate(string $projectPath): array
    {
        if (!is_dir($projectPath)) {
            return ['error' => "Project path not found: $projectPath"];
        }

        $this->validateRoutes($projectPath);
        $this->validateControllers($projectPath);
        $this->validateServices($projectPath);
        $this->validateDtos($projectPath);
        $this->validateResources($projectPath);
        $this->validateFormRequests($projectPath);

        return [
            'valid' => empty($this->errors),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'stats' => [
                'controllers' => $this->controllerCount,
                'services' => $this->serviceCount,
                'requests' => $this->requestCount,
                'resources' => $this->resourceCount,
            ],
        ];
    }

    private function validateRoutes(string $projectPath): void
    {
        $routeFile = $projectPath . '/routes/api.php';
        if (!file_exists($routeFile)) {
            $this->warnings[] = "No routes/api.php file found (API routes)";
            return;
        }

        $content = file_get_contents($routeFile);

        if (!preg_match('/[A-Z][a-zA-Z]+Controller::class/', $content)) {
            $this->warnings[] = "Routes should reference Controller classes";
        }
    }

    private function validateControllers(string $projectPath): void
    {
        $controllerDir = $projectPath . '/app/Http/Controllers';
        if (!is_dir($controllerDir)) {
            $this->warnings[] = "No Controllers directory found at: $controllerDir";
            return;
        }

        $controllers = $this->getPhpFiles($controllerDir);
        foreach ($controllers as $controller) {
            $content = file_get_contents($controller);
            $className = basename($controller, '.php');

            if (strpos($className, 'Controller') === false) {
                continue;
            }
            if ($className === 'Controller' || $className === 'BaseController') {
                continue;
            }
            if ($className === 'HomeController') {
                continue;
            }

            $this->controllerCount++;

            if (!preg_match('/public function \w+\([^)]*[A-Z][a-zA-Z]*Request/', $content)) {
                $this->warnings[] = "$className: Consider using FormRequest type-hinted parameters";
            }

            if (!preg_match('/Factory::\w+\(\)/', $content)) {
                $this->warnings[] = "$className: Consider using Factory pattern (ApiFactory/BackgroundFactory::xxx()) to call Service";
            }

            if (!preg_match('/return\s+new\s+[A-Z][a-zA-Z]*Resource|ResponseHelper::|\$this->sendSuccessResponse|RedirectResponse|redirect\(/', $content)) {
                $this->warnings[] = "$className: Consider returning Resource instances or using ResponseHelper";
            }

            if (preg_match('/DB::|Model::query\(\)|->where\(/', $content)) {
                $this->warnings[] = "$className: Controllers should not contain query logic (use Service)";
            }

            if (preg_match('/\\\\App\\\\/', $content) || preg_match('/\\\\Illuminate\\\\/', $content)) {
                $this->errors[] = "$className: Do NOT use FQN (e.g. \\App\\...). Use 'use' statements instead";
            }

            if (preg_match('/"[A-Z][a-z]+\s+[a-z]+/i', $content) && !preg_match('/trans\(|__\(/', $content)) {
                $this->warnings[] = "$className: Use i18n (trans() or __()) for user-facing text";
            }

            if (!preg_match('/extends\s+(?:Base)?Controller/', $content)) {
                $this->warnings[] = "$className: Should extend base Controller class";
            }
        }
    }

    private function validateServices(string $projectPath): void
    {
        $serviceDir = $projectPath . '/app/Services';
        if (!is_dir($serviceDir)) {
            $this->warnings[] = "No Services directory found at: $serviceDir";
            return;
        }

        $services = $this->getPhpFiles($serviceDir);
        foreach ($services as $service) {
            $content = file_get_contents($service);
            $className = basename($service, '.php');

            if (strpos($className, 'Service') === false) {
                continue;
            }

            $this->serviceCount++;

            $isCommonService = strpos($content, 'namespace App\\Services\\Common') !== false;
            $isBaseClass = in_array($className, ['Service', 'TableService', 'MasterDataService']);
            $isTableService = strpos($className, 'TableService') !== false;

            // Only suggest DTOs when the service actually has a method that takes
            // parameters. A method-less placeholder service has nothing to convert.
            $hasMethodWithParams = preg_match('/function\s+\w+\(\s*[^)]+\)/', $content);
            if (!$isBaseClass && !$isCommonService && !$isTableService && $hasMethodWithParams && !preg_match('/[A-Z][a-zA-Z]+Data\s+\$/', $content)) {
                $this->warnings[] = "$className: Consider using DTOs for method parameters (e.g. LoginData)";
            }

            if (!$isBaseClass && preg_match('/function\s+\w+\(/', $content) && !preg_match('/function \w+\([^)]*\):\s*(void|array|string|int|bool|float|object|mixed|\?[A-Z][a-zA-Z0-9\\\\]*)/', $content)) {
                $this->warnings[] = "$className: Methods should have return type declarations";
            }

            if (preg_match('/\\\\App\\\\/', $content) || preg_match('/\\\\Illuminate\\\\/', $content)) {
                $this->errors[] = "$className: Do NOT use FQN (e.g. \\App\\...). Use 'use' statements instead";
            }

            if (preg_match('/throw new.*Exception\s*\(\s*["\'][^"\']+/', $content) && !preg_match('/trans\(|__\(/', $content)) {
                $this->warnings[] = "$className: Use i18n (trans() or __()) for exception messages";
            }

            if (!$isBaseClass && preg_match('/\bthrow\s+/', $content) && !preg_match('/@throws/', $content)) {
                $this->warnings[] = "$className: Document exceptions with @throws";
            }

            if (preg_match('/DB::transaction\s*\(/', $content)) {
                $this->errors[] = "$className: Do NOT use DB::transaction(). Use manual transaction (DB::beginTransaction(), commit(), rollBack()) instead";
            }
        }
    }

    private function validateDtos(string $projectPath): void
    {
        $dtoDir = $projectPath . '/app/DTOs';
        if (!is_dir($dtoDir)) {
            return;
        }

        $dtos = $this->getPhpFiles($dtoDir);
        foreach ($dtos as $dto) {
            $content = file_get_contents($dto);
            $className = basename($dto, '.php');

            if (!preg_match('/class\s+' . preg_quote($className, '/') . '/', $content)) {
                continue;
            }

            if (!preg_match('/final\s+readonly\s+class/', $content)) {
                $this->warnings[] = "$className: DTOs should be declared as final readonly class";
            }

            if (!preg_match('/public static function from\(/', $content)) {
                $this->warnings[] = "$className: DTO should have a from() factory method";
            }
        }
    }

    private function validateResources(string $projectPath): void
    {
        $resourceDir = $projectPath . '/app/Http/Resources';
        if (!is_dir($resourceDir)) {
            $this->warnings[] = "No Resources directory found at: $resourceDir";
            return;
        }

        $resources = $this->getPhpFiles($resourceDir);
        foreach ($resources as $resource) {
            $content = file_get_contents($resource);
            $className = basename($resource, '.php');

            if (strpos($className, 'Resource') === false) {
                continue;
            }

            $this->resourceCount++;

            if (!preg_match('/extends\s+\w+Resource/', $content)) {
                $this->errors[] = "$className: Resources must extend JsonResource or another Resource class";
            }

            if (!preg_match('/public function toArray\s*\([^)]*\)\s*:/', $content)) {
                $this->errors[] = "$className: Must implement toArray() with return type";
            }

            if (!preg_match('/public static \$wrap/', $content)) {
                $this->warnings[] = "$className: Consider setting \$wrap property (set to null to disable wrapping)";
            }
        }
    }

    private function validateFormRequests(string $projectPath): void
    {
        $requestDir = $projectPath . '/app/Http/Requests';
        if (!is_dir($requestDir)) {
            $this->warnings[] = "No FormRequests directory found at: $requestDir";
            return;
        }

        $requests = $this->getPhpFiles($requestDir);
        foreach ($requests as $request) {
            $content = file_get_contents($request);
            $className = basename($request, '.php');

            if (strpos($className, 'Request') === false) {
                continue;
            }

            $this->requestCount++;

            if (!preg_match('/extends\s+FormRequest/', $content)) {
                $this->errors[] = "$className: Requests must extend FormRequest";
            }

            if (!preg_match('/public function rules\s*\(\)/', $content)) {
                $this->errors[] = "$className: Must implement rules() method";
            }

            if (!preg_match('/public function authorize\s*\(\)/', $content)) {
                $this->warnings[] = "$className: Consider implementing authorize() for permission checks";
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

// =============================================================================
// SECTION 2: Command Structure Validator
// =============================================================================

class CommandStructureValidator
{
    private array $errors = [];
    private array $warnings = [];

    public function validate(string $projectPath): array
    {
        $commandPath = $projectPath . '/app/Console/Commands';

        if (!is_dir($commandPath)) {
            return ['error' => "Commands directory not found at: $commandPath"];
        }

        $commands = $this->getPhpFiles($commandPath);

        foreach ($commands as $command) {
            $this->validateCommand($command);
        }

        return [
            'valid' => empty($this->errors),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'total' => count($commands),
        ];
    }

    private function validateCommand(string $commandPath): void
    {
        $content = file_get_contents($commandPath);
        $className = basename($commandPath, '.php');

        if (!preg_match('/extends\s+Command/', $content)) {
            $this->errors[] = "$className: Must extend Illuminate\\Console\\Command";
        }

        if (!preg_match('/protected \$signature/', $content)) {
            $this->errors[] = "$className: Must define \$signature property";
        } else {
            if (!preg_match('/[a-z]+:[a-z-]+/', $content)) {
                $this->warnings[] = "$className: Signature should follow 'module:action' format";
            }
        }

        if (!preg_match('/protected \$description/', $content)) {
            $this->errors[] = "$className: Must define \$description property";
        }

        if (!preg_match('/function handle\(\)/', $content)) {
            $this->errors[] = "$className: Must implement handle() method";
        } else {
            if (!preg_match('/function handle\(\):\s*(int|void)/', $content)) {
                $this->warnings[] = "$className: handle() should declare return type (int for exit codes)";
            }

            if (!preg_match('/try\s*\{/', $content) || !preg_match('/catch\s*\(/', $content)) {
                $this->warnings[] = "$className: handle() should wrap logic in try-catch";
            }
        }

        if (!preg_match('/\$this->option\(|\$this->argument\(/', $content)) {
            $this->warnings[] = "$className: Validate input with options() and arguments()";
        }

        $isSystemCommand = preg_match('/namespace.*Console\\\\Commands\\\\System/', $content);

        if (!$isSystemCommand && !preg_match('/Service::|Service->/', $content)) {
            $this->warnings[] = "$className: Delegate business logic to Service classes";
        }

        if (!$isSystemCommand && !preg_match('/new\s+[A-Z][a-zA-Z]*Data\s*\(/', $content)) {
            $this->warnings[] = "$className: Wrap command arguments in DTOs (e.g. new CleanupData(...))";
        }

        if (preg_match('/foreach|while/', $content)) {
            if (!preg_match('/getProgressBar|createProgressBar|advance/', $content)) {
                $this->warnings[] = "$className: Use progress bar for batch operations";
            }
        }

        $outputMethods = ['info', 'error', 'warn', 'line', 'comment', 'table'];
        $hasOutput = false;
        foreach ($outputMethods as $method) {
            if (preg_match("/this->$method\(/", $content)) {
                $hasOutput = true;
                break;
            }
        }
        if (!$hasOutput) {
            $this->warnings[] = "$className: Provide user feedback with output methods";
        }

        if (preg_match('/\\\\App\\\\/', $content) || preg_match('/\\\\Illuminate\\\\/', $content)) {
            $this->errors[] = "$className: Do NOT use FQN (e.g. \\App\\...). Use 'use' statements instead";
        }

        if (preg_match('/this->(info|warn|error|line)\s*\(\s*["\'][^"\']+/', $content) && !preg_match('/trans\(|__\(/', $content)) {
            $this->warnings[] = "$className: Use i18n (trans() or __()) for console output messages";
        }

        if (preg_match('/DB::transaction\s*\(/', $content)) {
            $this->errors[] = "$className: Do NOT use DB::transaction(). Use manual transaction (DB::beginTransaction(), commit(), rollBack()) instead";
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

// =============================================================================
// SECTION 3: Database Structure Validator
// =============================================================================

class DatabaseStructureValidator
{
    private array $errors = [];
    private array $warnings = [];

    public function validate(string $projectPath): array
    {
        $this->validateMigrations($projectPath);
        $this->validateModels($projectPath);
        $this->validateEnums($projectPath);
        $this->validateFactories($projectPath);

        return [
            'valid' => empty($this->errors),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
        ];
    }

    private function validateMigrations(string $projectPath): void
    {
        $migrationPath = $projectPath . '/database/migrations';
        if (!is_dir($migrationPath)) {
            $this->errors[] = "Migrations directory not found";
            return;
        }

        $migrations = glob($migrationPath . '/*_*.php');
        foreach ($migrations as $migration) {
            $content = file_get_contents($migration);
            $filename = basename($migration);

            if (!preg_match('/^\d{4}_\d{2}_\d{2}_\d{6}_[a-z_]+\.php$/', $filename)) {
                $this->warnings[] = "Migration '$filename' doesn't follow naming convention";
            }

            if (preg_match('/\$table->foreign\([\'"]\w+[\'"]\)/', $content, $matches)) {
                preg_match_all('/\$table->(index|unique)\([\'"]\w+[\'"]/', $content, $indexes);
                if (empty($indexes[0])) {
                    $this->warnings[] = "Migration '$filename': Foreign keys should have corresponding indexes";
                }
            }

            if (preg_match('/softDeletes/', $content)) {
                if (!preg_match('/softDeletes\(\)/', $content)) {
                    $this->errors[] = "Migration '$filename': Use softDeletes() not softDeletesTz() for consistency";
                }
            }

            // Only CREATE-table migrations should carry timestamps(). ALTER
            // migrations (Schema::table) modify existing tables, so skip them.
            // Framework/system tables (cache, jobs, sessions, …) legitimately
            // have no timestamps, so exclude them.
            $systemTables = 'cache|cache_locks|jobs|job_batches|failed_jobs|sessions|password_reset_tokens|personal_access_tokens|migrations';
            $createsSystemTable = preg_match('/Schema::create\s*\(\s*[\'"](?:' . $systemTables . ')[\'"]/', $content);
            if (preg_match('/Schema::create\s*\(/', $content)
                && !$createsSystemTable
                && !preg_match('/\$table->timestamps/', $content)) {
                $this->warnings[] = "Migration '$filename': Consider adding timestamps()";
            }

            if (preg_match('/DB::transaction\s*\(/', $content)) {
                $this->errors[] = "Migration '$filename': Do NOT use DB::transaction(). Migrations are already wrapped in transactions";
            }
        }
    }

    private function validateModels(string $projectPath): void
    {
        $modelPath = $projectPath . '/app/Models';
        if (!is_dir($modelPath)) {
            $this->errors[] = "Models directory not found";
            return;
        }

        $models = $this->getPhpFiles($modelPath);
        foreach ($models as $model) {
            $content = file_get_contents($model);
            $className = basename($model, '.php');
            $relativePath = str_replace($modelPath, '', $model);

            if (strpos($relativePath, '/Scopes/') !== false) {
                continue;
            }

            if (preg_match('/^\s*trait\s+' . $className . '/m', $content)) {
                continue;
            }

            if (preg_match('/^\s*abstract\s+class\s+' . $className . '/m', $content)) {
                continue;
            }

            if (preg_match('/Laravel\\\\Passport|Spatie|oauth_|public \$timestamps\s*=\s*false/', $content)) {
                continue;
            }

            if (!preg_match('/namespace App\\\\Models/', $content)) {
                $this->errors[] = "$className: Must be in App\\Models namespace";
            }

            if (!preg_match('/extends\s+(?:Model|Authenticatable)/', $content)) {
                $this->errors[] = "$className: Must extend Illuminate\\Database\\Eloquent\\Model (or Authenticatable)";
            }

            if (!preg_match('/use HasFactory/', $content)) {
                $this->errors[] = "$className: Must use HasFactory trait";
            }

            if (!preg_match('/protected \$fillable/', $content)) {
                $this->errors[] = "$className: Must define \$fillable (NEVER use \$guarded)";
            }

            if (preg_match('/protected \$guarded/', $content)) {
                $this->errors[] = "$className: Must NOT use \$guarded. Use \$fillable instead";
            }

            if (preg_match('/SoftDeletes/', $content)) {
                if (!preg_match('/use SoftDeletes/', $content)) {
                    $this->errors[] = "$className: Import SoftDeletes trait properly";
                }
            }

            if (preg_match('/function \w+\(\)\s*\{/', $content)) {
                $this->warnings[] = "$className: Add return type hints to relationships (e.g., HasMany, BelongsTo)";
            }

            // Only nudge toward modern cast classes when a legacy 'string' cast is
            // present (→ AsStringable). Casts like 'array'/'json'/enum classes are fine.
            if (preg_match('/protected \$casts/', $content)
                && preg_match("/=>\s*'string'/", $content)
                && !preg_match('/AsEnumCollection|AsStringable/', $content)) {
                $this->warnings[] = "$className: Consider using modern cast types (AsEnumCollection, AsStringable)";
            }

            if (preg_match('/function scope\w+\(/', $content)) {
                $this->warnings[] = "$className: Ensure scopes return \$query for chaining";
            }
        }
    }

    private function validateEnums(string $projectPath): void
    {
        $enumPath = $projectPath . '/app/Enums';
        if (!is_dir($enumPath)) {
            return;
        }

        $enums = $this->getPhpFiles($enumPath);
        foreach ($enums as $enum) {
            $content = file_get_contents($enum);
            $className = basename($enum, '.php');

            if (!preg_match('/^\s*enum\s+' . preg_quote($className, '/') . '/m', $content)) {
                if (strlen(trim($content)) < 50 || !preg_match('/class\s+' . preg_quote($className, '/') . '/', $content)) {
                    continue;
                }
                $this->errors[] = "$className: Must be declared as enum, not class";
            }

            if (!preg_match('/:\s*(string|int)/', $content)) {
                $this->warnings[] = "$className: Consider using backed enum (: string or : int) for database storage";
            }

            if (!preg_match('/function label\(/', $content)) {
                $this->warnings[] = "$className: Consider adding label() method for display values";
            }
        }
    }

    private function validateFactories(string $projectPath): void
    {
        $factoryPath = $projectPath . '/database/factories';
        if (!is_dir($factoryPath)) {
            $this->errors[] = "Factories directory not found";
            return;
        }

        $factories = glob($factoryPath . '/*Factory.php');
        foreach ($factories as $factory) {
            $content = file_get_contents($factory);
            $className = basename($factory, '.php');

            if (!preg_match('/extends\s+Factory/', $content)) {
                $this->errors[] = "$className: Must extend Illuminate\\Database\\Eloquent\\Factories\\Factory";
            }

            if (!preg_match('/protected\s+(?:string\s+)?\$model\s*=/', $content)
                && !preg_match('/@extends\s+Factory/', $content)) {
                $this->errors[] = "$className: Must define \$model property or use @extends Factory<Model> annotation";
            }

            if (!preg_match('/public function definition\(\)/', $content)) {
                $this->errors[] = "$className: Must implement definition() method";
            }

            if (!preg_match('/fake\(\)->/', $content)) {
                $this->warnings[] = "$className: Use fake() helper for fake data generation";
            }

            if (preg_match('/\\\\App\\\\/', $content) || preg_match('/\\\\Illuminate\\\\/', $content)) {
                $this->errors[] = "$className: Do NOT use FQN (e.g. \\App\\...). Use 'use' statements instead";
            }

            if (preg_match('/label\s*\(\s*["\'][^"\']+/', $content) && !preg_match('/trans\(|__\(/', $content)) {
                $this->warnings[] = "$className: Use i18n (trans() or __()) for labels";
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

// =============================================================================
// SECTION 4: Job Structure Validator
// =============================================================================

class JobStructureValidator
{
    private array $errors = [];
    private array $warnings = [];

    public function validate(string $projectPath): array
    {
        $jobPath = $projectPath . '/app/Jobs';

        if (!is_dir($jobPath)) {
            // Jobs are optional; an absent directory is not an issue.
            return ['valid' => true, 'errors' => [], 'warnings' => [], 'total' => 0];
        }

        $jobs = $this->getPhpFiles($jobPath);

        foreach ($jobs as $job) {
            $this->validateJob($job);
        }

        return [
            'valid' => empty($this->errors),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'total' => count($jobs),
        ];
    }

    private function validateJob(string $jobPath): void
    {
        $content = file_get_contents($jobPath);
        $className = basename($jobPath, '.php');

        if (!preg_match('/implements\s+ShouldQueue/', $content)) {
            $this->errors[] = "$className: Must implement ShouldQueue interface";
        }

        $requiredTraits = ['Dispatchable', 'InteractsWithQueue', 'Queueable', 'SerializesModels'];
        foreach ($requiredTraits as $trait) {
            if (!preg_match("/use $trait;/", $content)) {
                $this->errors[] = "$className: Must use $trait trait";
            }
        }

        if (preg_match('/uniqueUntil|uniqueId/', $content) &&
            !preg_match('/implements\s+ShouldBeUnique/', $content)) {
            $this->warnings[] = "$className: Consider implementing ShouldBeUnique for unique jobs";
        }

        if (preg_match('/__construct\s*\([^)]*\)/', $content, $matches)) {
            if (!preg_match('/Dto\s+/', $matches[0]) &&
                !preg_match('/Data\s+/', $matches[0])) {
                $this->warnings[] = "$className: Constructor should accept DTO for type safety";
            }
        }

        if (!preg_match('/function handle\(/', $content)) {
            $this->errors[] = "$className: Must implement handle() method";
        } else {
            if (!preg_match('/BackgroundService|Service::run\(|Service->run\(/', $content)) {
                $this->warnings[] = "$className: handle() should delegate to BackgroundService";
            }

            if (!preg_match('/try\s*\{/', $content) || !preg_match('/catch\s*\(/', $content)) {
                $this->warnings[] = "$className: handle() should have try-catch for error handling";
            }
        }

        if (preg_match('/user_id|userId/', $content)) {
            if (!preg_match('/User::find\(|auth\(\)->user/', $content)) {
                $this->warnings[] = "$className: Preserve user context in constructor, resolve in handle()";
            }
        }

        if (!preg_match('/public \$timeout|public \$tries|public \$backoff/', $content)) {
            $this->warnings[] = "$className: Consider defining timeout/tries/backoff properties";
        }

        if (preg_match('/catch\s*\(/', $content)) {
            if (!preg_match('/release\(|fail\(/', $content)) {
                $this->warnings[] = "$className: Handle failures with release() or fail() in catch block";
            }
        }

        if (preg_match('/static function dispatch/', $content)) {
            $this->warnings[] = "$className: Use Job::dispatch() static method, don't define custom dispatch";
        }

        if (preg_match('/\\\\App\\\\/', $content) || preg_match('/\\\\Illuminate\\\\/', $content)) {
            $this->errors[] = "$className: Do NOT use FQN (e.g. \\App\\...). Use 'use' statements instead";
        }

        if (preg_match('/DB::transaction\s*\(/', $content)) {
            $this->errors[] = "$className: Do NOT use DB::transaction(). Use manual transaction (DB::beginTransaction(), commit(), rollBack()) instead";
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

// =============================================================================
// SECTION 5: Test Structure Validator
// =============================================================================

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

            if (!str_ends_with($className, 'Test')) {
                $this->errors[] = "$relativePath: Class name must end with 'Test'";
            }

            if (!preg_match('/extends\s+TestCase/', $content)) {
                $this->errors[] = "$relativePath: Must extend Tests\\TestCase";
            }

            $touchesDb = preg_match('/(Model::|DB::|assertDatabase|postJson|putJson|patchJson|deleteJson)/', $content);
            if ($touchesDb && !preg_match('/use RefreshDatabase/', $content)) {
                $this->errors[] = "$relativePath: Feature tests touching DB must use RefreshDatabase trait";
            }

            if (preg_match('/function test_/', $content)) {
                // Good - using test_ prefix
            } else {
                $this->warnings[] = "$relativePath: Test methods should use 'test_' prefix";
            }

            if (!preg_match('/\/\/ Arrange/', $content)) {
                $this->warnings[] = "$relativePath: Add '// Arrange' comment for clarity";
            }
            if (!preg_match('/\/\/ Act/', $content)) {
                $this->warnings[] = "$relativePath: Add '// Act' comment for clarity";
            }
            if (!preg_match('/\/\/ Assert/', $content)) {
                $this->warnings[] = "$relativePath: Add '// Assert' comment for clarity";
            }

            $makesHttpCall = preg_match('/->(getJson|postJson|putJson|patchJson|deleteJson|get|post|put|patch|delete|call|json)\(/', $content);
            $mutatesViaHttp = preg_match('/->(postJson|putJson|patchJson|deleteJson|post|put|patch|delete)\(/', $content);
            // Auth-entry / guest / public flows assert auth state, not table rows.
            $isAuthFlow = preg_match('/login|logout|register|guest|unauth/i', $content);
            // State may be verified via the DB, the model, a hash check, or a mock.
            $verifiesState = preg_match('/assertDatabaseHas|assertDatabaseMissing|assertDatabaseCount|Hash::check|->refresh\(|shouldReceive|assertAuthenticated/', $content);

            // HTTP status is only meaningful for tests that actually hit an endpoint.
            // Model/event integration tests (no HTTP call) are exempt.
            if ($makesHttpCall && !preg_match('/assertStatus\(/', $content)) {
                $this->errors[] = "$relativePath: Must assert HTTP status codes";
            }

            // Mutating endpoint tests should verify persisted state — unless they
            // already verify it (DB/model/hash/mock) or are auth-flow tests.
            if ($mutatesViaHttp && !$verifiesState && !$isAuthFlow) {
                $this->warnings[] = "$relativePath: Consider asserting database state for mutation tests";
            }

            // Authenticated mutating-endpoint tests should authenticate. Skip
            // auth-entry/guest/public flows and tests that already call actingAs().
            if ($makesHttpCall && $mutatesViaHttp && !$isAuthFlow && !preg_match('/actingAs\(/', $content)) {
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

            if (!str_ends_with($className, 'Test')) {
                $this->errors[] = "$relativePath: Class name must end with 'Test'";
            }

            if (!preg_match('/extends\s+TestCase/', $content)) {
                $this->errors[] = "$relativePath: Must extend Tests\\TestCase";
            }

            if (preg_match('/use RefreshDatabase/', $content)) {
                $this->warnings[] = "$relativePath: Unit tests shouldn't use RefreshDatabase (mock dependencies)";
            }

            // Only suggest mocking when the test has a collaborator to mock
            // (a service/helper/repository/action or an instantiated class).
            $hasCollaborator = preg_match('/App\\\\(Services|Helpers|Repositories|Actions)\\\\|new\s+[A-Z]\w+\s*\(/', $content);
            if ($hasCollaborator && !preg_match('/Mockery|createMock|partialMock/', $content)) {
                $this->warnings[] = "$relativePath: Consider mocking dependencies in unit tests";
            }

            if (!preg_match('/function test_/', $content)) {
                $this->warnings[] = "$relativePath: Test methods should use 'test_' prefix";
            }

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

// =============================================================================
// SECTION 6: Master Data Structure Validator
// =============================================================================

class MasterDataStructureValidator
{
    private array $errors = [];
    private array $warnings = [];

    public function validate(string $projectPath): array
    {
        $driverPath = $projectPath . '/app/Driver/MasterData';
        $registryPath = $projectPath . '/config/master-data.php';

        if (!is_dir($driverPath)) {
            // Custom MasterData drivers are optional; an absent directory is fine.
            return ['valid' => true, 'errors' => [], 'warnings' => [], 'total' => 0];
        }

        $drivers = $this->getPhpFiles($driverPath);

        foreach ($drivers as $driver) {
            $this->validateDriver($driver);
        }

        // Check registry if exists
        if (file_exists($registryPath)) {
            $this->validateRegistry($registryPath);
        }

        return [
            'valid' => empty($this->errors),
            'errors' => $this->errors,
            'warnings' => $this->warnings,
            'total' => count($drivers),
        ];
    }

    private function validateDriver(string $driverPath): void
    {
        $content = file_get_contents($driverPath);
        $className = basename($driverPath, '.php');

        // Check extends MasterDataDriver
        if (!preg_match('/extends\s+MasterDataDriver/', $content)) {
            $this->errors[] = "$className: Must extend MasterDataDriver";
        }

        // Check required methods
        $requiredMethods = ['getAll', 'getById', 'create', 'update', 'delete'];
        foreach ($requiredMethods as $method) {
            if (!preg_match("/function $method\(/", $content)) {
                $this->errors[] = "$className: Must implement $method() method";
            }
        }

        // Check for type hints
        if (!preg_match('/function \w+\([^)]*\):/', $content)) {
            $this->warnings[] = "$className: Add return type hints to methods";
        }

        // Check for proper return types
        if (preg_match('/function getAll\(/', $content)) {
            if (!preg_match('/function getAll[^)]*\):\s*Collection/', $content)) {
                $this->warnings[] = "$className: getAll() should return Collection";
            }
        }
    }

    private function validateRegistry(string $registryPath): void
    {
        $content = file_get_contents($registryPath);

        // Check driver registration
        if (!preg_match('/drivers\s*=>/', $content)) {
            $this->warnings[] = "Registry: Define 'drivers' array";
        }

        // Check master data types
        if (!preg_match('/types\s*=>/', $content)) {
            $this->warnings[] = "Registry: Define 'types' array";
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

// =============================================================================
// MAIN VALIDATION RUNNER
// =============================================================================

class BackendValidator
{
    private string $projectPath;
    private array $results = [];

    public function __construct(string $projectPath)
    {
        $this->projectPath = realpath($projectPath) ?: $projectPath;
    }

    public function run(): int
    {
        echo "╔════════════════════════════════════════════════════════════════╗\n";
        echo "║           BACKEND CODE VALIDATOR - Laravel Standards          ║\n";
        echo "╚════════════════════════════════════════════════════════════════╝\n\n";
        echo "Project: {$this->projectPath}\n\n";

        // 1. API Validation
        $this->runSection('API Structure', fn() => (new ApiStructureValidator())->validate($this->projectPath));

        // 2. Command Validation
        $this->runSection('Command Structure', fn() => (new CommandStructureValidator())->validate($this->projectPath));

        // 3. Database Validation
        $this->runSection('Database Structure', fn() => (new DatabaseStructureValidator())->validate($this->projectPath));

        // 4. Job Validation
        $this->runSection('Job Structure', fn() => (new JobStructureValidator())->validate($this->projectPath));

        // 5. Test Validation
        $this->runSection('Test Structure', fn() => (new TestStructureValidator())->validate($this->projectPath));

        // 6. Master Data Validation
        $this->runSection('Master Data Structure', fn() => (new MasterDataStructureValidator())->validate($this->projectPath));

        return $this->printSummary();
    }

    private function runSection(string $name, callable $validator): void
    {
        echo str_repeat('─', 64) . "\n";
        echo "🔍 $name\n";
        echo str_repeat('─', 64) . "\n";

        $result = $validator();
        $this->results[$name] = $result;

        if (isset($result['error'])) {
            echo "⚠️  {$result['error']}\n";
            return;
        }

        if (isset($result['stats'])) {
            echo "📊 Stats:\n";
            foreach ($result['stats'] as $key => $value) {
                echo "   - " . ucfirst($key) . ": $value\n";
            }
            echo "\n";
        }

        if (isset($result['total']) && $result['total'] > 0) {
            echo "📊 Total validated: {$result['total']}\n\n";
        }

        if ($result['valid'] && empty($result['errors'])) {
            echo "✅ $name validation passed!\n";
        } else {
            echo "❌ $name validation failed:\n";
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

        echo "\n";
    }

    private function printSummary(): int
    {
        echo str_repeat('═', 64) . "\n";
        echo "📋 SUMMARY\n";
        echo str_repeat('═', 64) . "\n";

        $totalErrors = 0;
        $totalWarnings = 0;
        $sectionsPassed = 0;
        $sectionsTotal = 0;

        foreach ($this->results as $name => $result) {
            $sectionsTotal++;
            if (isset($result['error'])) {
                echo "⚠️  $name: Skipped - {$result['error']}\n";
                continue;
            }

            $errors = count($result['errors'] ?? []);
            $warnings = count($result['warnings'] ?? []);
            $totalErrors += $errors;
            $totalWarnings += $warnings;

            if ($errors === 0) {
                $sectionsPassed++;
                echo "✅ $name: PASSED";
            } else {
                echo "❌ $name: FAILED ($errors errors";
                if ($warnings > 0) {
                    echo ", $warnings warnings";
                }
                echo ")";
            }
            echo "\n";
        }

        echo str_repeat('─', 64) . "\n";
        echo "Sections: $sectionsPassed/$sectionsTotal passed\n";
        echo "Total Errors: $totalErrors\n";
        echo "Total Warnings: $totalWarnings\n";
        echo str_repeat('═', 64) . "\n";

        if ($totalErrors === 0 && $sectionsPassed === $sectionsTotal) {
            echo "🎉 All validations passed!\n";
            return 0;
        } else {
            echo "⚠️  Some validations failed. Please review the errors above.\n";
            return 1;
        }
    }
}

// =============================================================================
// CLI ENTRY POINT
// =============================================================================

if (PHP_SAPI === 'cli') {
    $path = $argv[1] ?? null;

    if (!$path) {
        echo "Backend Code Validator - Laravel Standards\n\n";
        echo "Usage: php validate-backend.php <project-path>\n";
        echo "Example: php validate-backend.php backend\n\n";
        echo "This script validates:\n";
        echo "  • API Structure (Controllers, Services, DTOs, Resources, FormRequests)\n";
        echo "  • Command Structure (Artisan Commands)\n";
        echo "  • Database Structure (Migrations, Models, Enums, Factories)\n";
        echo "  • Job Structure (Background Jobs)\n";
        echo "  • Test Structure (Feature/Unit Tests)\n";
        echo "  • Master Data Structure (Driver, Registry)\n";
        exit(1);
    }

    $validator = new BackendValidator($path);
    exit($validator->run());
}
