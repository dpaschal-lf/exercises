<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}

$query = "SELECT 
    u.name, u.cohortID, u.currentLessonID, u.currentTopic,
    us.positionID, us.userID AS studentID, 
    l.title, l.id,
    (SELECT count(id) 
        FROM codeSubmissions 
        WHERE userID=u.id AND lessonID=u.currentLessonID 
        GROUP BY lessonID) AS attemptCount,
    (SELECT max(submitted) 
        FROM codeSubmissions 
        WHERE userID=u.id AND lessonID=u.currentLessonID 
        GROUP BY lessonID) AS lastAttempt
    FROM users AS u
    JOIN userSeating AS us
        ON us.userID = u.id
    JOIN lessons AS l
        ON l.orderID = u.currentLessonID AND l.topic = u.currentTopic
    WHERE u.cohortID = ?";

// $query = "SELECT 
//     u.name, u.cohortID, u.currentLessonID, u.currentTopic,
//     us.positionID, b.attemptedCount, b.lastAttempt,
//     l.title, l.id
//     FROM users AS u
//     JOIN userSeating AS us
//         ON us.userID = u.id
//     JOIN lessons AS l
//         ON l.orderID = u.currentLessonID AND l.topic = u.currentTopic
//     LEFT JOIN (SELECT count(id) AS attemptedCount, max(submitted) AS lastAttempt
//         FROM codeSubmissions 
//         GROUP BY lessonID) b
//         ON b.userID = u.id AND b.lessonID=u.currentLessonID
//     WHERE u.cohortID = 1";

$result = prepare_statement($query, [$_GET['id']]);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}

if($result->num_rows===0){
    throw new Exception("cohort is empty");
}

$students = [];
while($row = $result->fetch_assoc()){
    $students[$row['positionID']] = $row;
}

$data = [
    'currentServerTime' => date('Y-m-d H:i:s'),
    'students'=>$students
];

?>