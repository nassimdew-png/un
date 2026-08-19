<?php

return [

    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [

        'mongodb' => [
            'driver'   => 'mongodb',
            'host'     => env('DB_HOST', '127.0.0.1'),
            'port'     => env('DB_PORT', 27017),
            'database' => env('DB_DATABASE', 'psypro_saas_db'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', 'secure_psypro_password'),
            'options'  => [
                'database' => env('DB_AUTHENTICATION_DATABASE', 'admin'),
            ],
        ],

        'sqlite' => [
            'driver' => 'sqlite',
            'database' => database_path('database.sqlite'),
            'prefix' => '',
        ],

    ],

    'migrations' => 'migrations',

];
