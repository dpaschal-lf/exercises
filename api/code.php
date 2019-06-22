<?php
session_start();
require_once('mysql_connect.php');
require_once('functions.php');
set_exception_handler('error_handler');
define('INTERNAL', true);
define('BASE', 'methods/code/');


switch($_SERVER['REQUEST_METHOD']){
    case 'PUT':
        require_once(BASE.'put.php');
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