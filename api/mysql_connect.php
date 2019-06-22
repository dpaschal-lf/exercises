<?php

$db = new mysqli('localhost','root','root','exercises',3306);

if($db->connect_error){
    throw new Exception($db->connect_error);
}

?>