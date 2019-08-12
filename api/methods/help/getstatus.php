<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}

$userID = $_SESSION['userID'];
$query = "SELECT `status` FROM helpRequests WHERE `status` IN ('active','accepted') AND userID = ?";

$result = prepare_statement($query, [
    $_SESSION['userID']
]);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}

$data = [
    'requestPending'=> $result->num_rows ? true : false,
    'serverTime'=> date("Y-m-d H:i:s")
];


?>