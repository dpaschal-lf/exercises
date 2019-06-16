<?php

if(!function_exists('error_handler')){
    function error_handler($error){
        $output = [
            'success'=>false,
            'error'=> $error-getMessage()
        ];
    }
}


?>