<?php

if(!defined('INTERNAL')){
    exit('no direct calls');
}
if(empty($_SESSION['userID'])){
    throw new Exception('must be logged in');
}
$postData = get_body_data();
if(empty($postData['helpId'])){
    $query = "SELECT id FROM helpRequests WHERE `status` IN ('active','accepted') AND userID = ? ORDER BY requested DESC LIMIT 1";
    $result = prepare_statement($query, [
        $_SESSION['userID']
    ]);
    if(!$result){
        throw new Exception('invalid query: '.$db->error);
    }
    if($result->num_rows<1){
        throw new Exception('no help requests pending');
    }
    $postData['helpId'] = $result->fetch_assoc()['id'];
}
if(empty($postData['status'])){
    throw new Exception('must provide status');
}
$statusChanges = [
    'active'=>'accepted',
    'accepted'=>'active',
    'answered'=>'answered',
    'cancelled'=>'cancelled'
];
if(!isset($statusChanges[$postData['status']])){
    throw new Exception('invalid status: '. $postData['status']);
}

$nextStatus = $statusChanges[$postData['status']];
$query = "UPDATE helpRequests SET status= ?
    WHERE id = ?";

$result = prepare_statement($query, [
    $nextStatus, 
    $postData['helpId']
]);

//$result = $db->query($query);
//print_r($db);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->affected_rows===0){
    throw new Exception("could not update");
}

$data = ['updated'=>date("Y-m-d H:i:s")];

?>