<?php
session_start();
require_once('mysql_connect.php');
require_once('functions.php');
set_exception_handler('error_handler');
define('INTERNAL', true);
define('BASE', 'methods/help/');

require_once('startup.php');


switch($_SERVER['REQUEST_METHOD']){
    case 'POST':
        require_once(BASE.'post.php');
        break;
    case 'GET':
        if(isset($_GET['type']) && $_GET['type'] ==='all'){
            require_once(BASE.'get.php');
        } else {
            require_once(BASE.'getstatus.php');
        }
        
        break;
    case 'PATCH':
        require_once(BASE.'patch.php');
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