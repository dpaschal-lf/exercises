<?php
session_start();
require_once('mysql_connect.php');
require_once('functions.php');
set_exception_handler('error_handler');
define('INTERNAL', true);
define('BASE', 'methods/users/');

switch($_SERVER['REQUEST_METHOD']){
    case 'PATCH':
            require(BASE.'patch.php');
        break;
    default:
        throw new Exception($_SERVER['REQUEST_METHOD'] . ' not supported');
}

$output = [
    'success'=>true,
    'data'=>$data
];
$json_output = json_encode( $output, JSON_INVALID_UTF8_SUBSTITUTE);

print( nl2br($json_output));
?>