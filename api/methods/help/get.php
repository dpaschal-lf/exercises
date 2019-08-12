<?php
if(!defined('INTERNAL')){
    exit('no direct calls');
}

$query = "SELECT hr.id, hr.userID, hr.requested, hr.problem, hr.topic, hr.status, hr.requests,
        u.name,
        c.name AS cohortName, c.location,
        us.positionID, 
        l.title AS lessonTitle, l.topic AS lessonTopic
        FROM helpRequests AS hr
            JOIN users AS u
                ON hr.userID = u.id
            JOIN classes AS c
                ON u.cohortID = c.id
            JOIN userSeating AS us
                ON hr.userID = us.userID AND u.cohortID = us.cohortID
            JOIN lessons AS l
                ON hr.lessonID = l.id
        WHERE hr.status IN ('active', 'accepted')
        ORDER BY hr.status, hr.requested
";
$result = $db->query($query);
if(!$result){
    throw new Exception('invalid query: '.$db->error);
}

$data = [
    'requests'=> [],
    'serverTime'=> date("Y-m-d H:i:s")
];
while($row = $result->fetch_assoc()){
    $data['requests'][] = $row;
}

?>