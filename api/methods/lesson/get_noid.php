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
$lessonIDString = '';
while( $row = $result->fetch_assoc()){
    $lessonData[$row['id']] = $row;
    $lessonIDString .= $row['id'].','; 
}

$lessonIDString = substr($lessonIDString, 0, -1);

$query = "SELECT lessonID, `status`, COUNT(lessonID) AS count
FROM `codeSubmissions`
WHERE userID = ? AND lessonID IN ($lessonIDString)
GROUP BY lessonID, `status`
";

 
$result = prepare_statement($query, [$_SESSION['userID']]);

if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
if($result->num_rows===0){
    throw new Exception('no such topic');
}
while($row = $result->fetch_assoc()){
    $mode = $row['status'].'Count';
    $lessonData[$row['lessonID']][$mode] = $row['count'];
}

$data['lessonList'] = $lessonData;

?>