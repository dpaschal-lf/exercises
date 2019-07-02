<?php
session_start();

require_once('functions.php');
unset($_SESSION['userID']);
session_destroy();
set_exception_handler('error_handler');

$output = ['success'=>true];

print( json_encode( $output ));

?>