<?php

if(empty($_SESSION['userID'])){
    throw new Exception('pre: must be logged in to use this endpoint');
}
$rights = get_rights_data($_SESSION['userID']);

?>