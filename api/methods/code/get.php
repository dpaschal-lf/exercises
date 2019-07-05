<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}
if(empty($_GET['studentID'])){
    $userID = $_SESSION['userID'];
} else {
    $userID = $_GET['studentID'];
}
if(empty($_GET['lessonID'])){
    throw new Exception('must provide lesson ID');
}
$query = "SELECT prompt, sidebarInfo, NOW() AS currentTime FROM lessons WHERE id = ?";
$result = prepare_statement($query, [$_GET['lessonID']]);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}
$lessonData = $result->fetch_assoc();

$query = "SELECT * FROM codeSubmissions
    WHERE userID = ? AND lessonID = ?
    ORDER BY submitted DESC";
// $query = "SELECT * FROM codeSubmissions
// WHERE userID = {$_SESSION['userID']} AND lessonID = {$_GET['lessonID']}
// ORDER BY submitted DESC";

$result = prepare_statement($query, [$userID, $_GET['lessonID']]);
// $result = $db->query($query);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}

$data = [];
$data['submissions'] = [];
$data['lessonData'] = $lessonData;

while($row = $result->fetch_assoc()){
    $data['submissions'][] = $row;
}

?>