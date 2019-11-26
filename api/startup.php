<?php

if(!function_exists('requireLogin')){
    function requireLogin(){
        if(empty($_SESSION['userID'])){
            throw new Exception('pre: must be logged in to use this endpoint');
        }
    }
}

if(!function_exists('getRights')){
    function getRights(){
        $rights = get_rights_data($_SESSION['userID']);
        return $rights;
    }
}



?>