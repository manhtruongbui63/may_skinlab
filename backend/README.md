# Setup project

- Install composer

```cmd
composer install
```

- Create database with project. Default `laravel_base`.

- Create `.env` file

```cmd
cp .env.example .env
```

- Generate `APP_KEY`

```cmd
php artisan key:gen
```

- Config `.env` file

```php
APP_NAME="Laravel Base"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL="https://laravel-base.abc"
APP_USER_URL="http://localhost"
APP_LANG=en
APP_FAKER_LOCALE=en_US
APP_TIMEZONE=UTC

# 'stack' if you have set telegram message
LOG_CHANNEL=daily

# Config with database of project
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel_base
DB_USERNAME=root
DB_PASSWORD=

# Config Telegram Message
TELEGRAM_LOG_LEVEL=debug
TELEGRAM_BOT_TOKEN=
TELEGRAM_LOG_GROUP_ID=

```

# General rules
## Functions must have a docblock and the type of the passed param
Ví dụ:

```php
/**
 * Store User
 *
 * @param array $data
 * @return User
 */
public function store($data)
{
    return User::create($data);
}
```

```php
/**
 * @return \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder
 */
public function makeNewQuery()
{
    return User::isActive();
}
```

```php
/**
 * Set the relationships that should be eager loaded.
 *
 * @param  string|array  $relations
 * @param  string|\Closure|null  $callback
 * @return $this
 */
public function with($relations, $callback = null)
{
    $this->currentQuery()->with(...func_get_args());

    return $this;
}
```

## Attributes require a docblock
Ví dụ:

```php
/**
 * @var integer
 */
protected $perPage = 10;
```

```php
/**
 * @var \Illuminate\Database\Eloquent\Builder|\Illuminate\Database\Query\Builder
 */
protected $query;
```

# Code flow, details of components

route -> middleware -> request -> controller -> service -> controller -> resource -> return


## Route

- Navigate requests
- `route` must be grouped into neat groups
- The name `route` must be meaningful and not too long
- `route` to get data will have a method of `get`, to change data the method will be `post` (create, update, delete)
- CURD uses 5 basic api names (`list`, `store`, `detail`, `update`, `destroy`).

## Middleware

- `auth` confirmation
- Block decentralization

## Request

- Handles `validate`

## Controller

- Write `middleware` into `__construct()` of `controller`
- `Controller` will handle getting data from `Request` to send to `Service`

## Service

- Logical processing.
- Query DB to retrieve data, update data into DB.
- Be careful to only retrieve necessary data.

## Resource

- Transform data before returning it.
- Master data alone will not have resources, must transform data in the service.

# Rules for writing Model

- Each model will correspond to 1 table.
- Each model will have a corresponding trait scope in the `Scopes` folder. The model will `use` that trait scope.
- All scopes will be written to the scope file and not to the model.
- The `Traits` folder is used to store code used in many models. For example, multiple models with the same status can be written into traits.

# Rules for writing Controller

- A controller can perform one function or many related functions.
- Handle getting params from the request before passing it to the service in the controller.
- Do not use `$request->all()`. Use `$request->only(['pr1', 'pr2'])`.
- Limit transmission of requests to the service.
- In a controller, only call 1 service. The service will call other services if necessary.

# Rules for writing Service

- All services must extend abstract class `Service`.
- When adding a service, register it in the corresponding `app/Factories/*` directory and add a method to instantiate it.
```php
$app->scoped(AuthService::class, function ($app) {
    return new AuthService();
});
```

```php
/**
 * Get Auth Service
 *
 * @return AuthService
 */
public static function getAuthService()
{
    return app(AuthService::class);
}
```

- When using a service, always call the static method defined in the corresponding Factory to get the service object to use.

# How to use transaction

- Must write transactions when creating/update/delete operations feature multiple tables in the DB.
- Transaction must comply with the structure below. Under `DB::commit()` only return data. Do not call another function.
- You should write the transaction in the service (function called by the controller).
- Do not call a transaction function within another transaction. This will cause transactions to be nested.
- In a transaction, the order of updating tables must follow a certain flow.

## Structure of a transaction

```php
try {
    DB::beginTransaction();

    // code here
    // make $data;

    DB::commit();
    return $data;
} catch (Exception $e) {
    DB::rollBack();
    throw $e;
}
```

or

```php
$data = null;
try {
    DB::beginTransaction();

    // code here
    // modify $data;

    DB::commit();
} catch (Exception $e) {
    DB::rollBack();
    throw $e;
}
return $data;
```

## In a transaction, the order of updating tables must follow a certain flow

- Table order when updating or deleting must be the same as table order when creating
- When using a transaction, you must write the table order in that transaction into the `transaction-follow.md` file.
  Full Class name: class name containing `DB::beginTransaction()`. The name must be full name. For example: `App\Services\User\UserService`.
    - Method name: method name containing `DB::beginTransaction()`.
    - Content is the table order used

For example: A product has many photos.

```php
// Create product: table order products -> images
$product = Product::create(['name' => 'Product 1']);
$product->images()->create(['url' => 'https://img.example/img.jpg']);

// Delete product: table order products -> images
Product::where('id', 1)->delete();
Image::where('product_id', 1)->delete();
```

# Query log
```php
DB::enableQueryLog();
$queries = DB::getQueryLog();
```

# Rules for writing commands

- Command files must be organized in folders according to the purpose of each module.
    - For example, `App\Console\Commands\System` contains commands related to the system, `App\Console\Commands\Fake` contains commands related to fake test data.
- All `$signature` commands must define `const` in `app/Console/Kernel.php` starting with the prefix `CMD_`.
- Must define `$description` in command files to know the command's purpose.
- For `Fake` data command modules are only allowed to run when `APP_ENV=local`.

# Rules for writing schedules

- All schedules must be defined in `routes/console.php`

# Rule for code format

- Before committing, run `php artisan code:format --check` to verify the code format.
- The formatting rules are defined in `pint.json`.
- To check and automatically fix formatting issues, run `php artisan code:format`.

# Api docs

- The default route for the API documentation is `APP_URL/docs/api`.
- The configuration file for the API documentation is located at `config/scramble.php`.
- When adding new routes, ensure they are prefix with `api/` to be included in the API documentation.