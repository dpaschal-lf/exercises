<?php

if(!defined('INTERNAL')){
    exit('no direct calls');
}
$query = "SELECT id, title, orderID
    FROM lessons 
    WHERE topic = ?
    ORDER BY orderID";

$result = prepare_statement($query, [$_GET['topic']]);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->num_rows===0){
    throw new Exception('no such topic');
}

$data = [];
$lessonData = [];
$data['lessonList'] = [];
while( $row = $result->fetch_assoc()){
    $lessonData = [$row['id']] = $row;
}
//, COUNT(id)
$query = "SELECT id
    FROM codeSubmissions 
    WHERE userID = ?
";
//-- GROUP BY lessonID, `status` 
$result = prepare_statement($query, [$_SESSION['userID']]);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->num_rows===0){
    throw new Exception('no such topic');
}

foreach($lessonData AS $key){
    $lessonData[$key] = [
        'id'=> $lessonData['key'],
        'a'
    ]
}

?>