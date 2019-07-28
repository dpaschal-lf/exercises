<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}
$postData = get_body_data();
if(empty($_SESSION['userID'])){
    throw new Exception('must be logged in');
}
if(empty($postData['users'])){
    throw new Exception('must provide users');
}
if(empty($postData['cohortName'])){
    throw new Exception('must provide cohort name');
}
if(empty($postData['location'])){
    throw new Exception('must provide cohort location');
}
$result = $db->query("START TRANSACTION");
if(!$result){
    throw new Exception('error starting transaction');
}
$query = "INSERT INTO classes SET `name` = ?, created = NOW(), location = ?";
$result = prepare_statement($query, [
    $postData['cohortName'],
    $postData['location']
]);
$cohortID = $result->insert_id;

$query = "INSERT INTO users (email, `name`, cohortID) VALUES (?,?,?)";

$statement = $db->prepare($query);

foreach($postData['users'] AS $key=>$value){
    $statement->bind_param('ssi', $value['email'], $value['name'], $cohortID );
    if(!$statement){
        $db->query("ROLLBACK");
        throw new Exception('error with statement 2');
    }
    $result = $statement->execute();
    if(!$result){
        $db->query("ROLLBACK");
        throw new Exception('error with result 1');       
    }
    $postData['users'][$key]['id'] = $statement->insert_id;
}

$query = "INSERT INTO userSeating (userID, positionID, cohortID) VALUES (?,?,?)";

$statement = $db->prepare($query);

foreach($postData['users'] AS $key=>$value){
    $statement->bind_param('iii', $value['id'], $key, $cohortID );
    if(!$statement){
        $db->query("ROLLBACK");
        throw new Exception('error with statement 2'.$statement->error);
    }
    $result = $statement->execute();
    if(!$result){
        $db->query("ROLLBACK");
        throw new Exception('error with result 2');       
    }
}

$db->query("COMMIT");
$data = [
    'message'=> 'users posted '. count($postData['users']),
];

?>