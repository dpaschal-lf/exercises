<?php

if(!function_exists('error_handler')){
    function error_handler($error){
        $output = [
            'success'=>false,
            'error'=> $error->getMessage()
        ];
        print(json_encode($output));
        exit();
    }
}

if(!function_exists('prepare_statement')){
    function prepare_statement($query, $params){
        global $db;
        if(strlen($query)===0){
            return false;
        }
        if(!is_array($params)){
            return false;
        }
        if(!is_object($db)){
            return false;
        } 
        $statement = $db->prepare($query);

        if(!$statement){
            throw new Exception('error with prepared statement: '.$query. ' : '.$statement->error);
        }
        $paramTypes = '';
        foreach($params AS $value){
            if(is_string($value)){
                $paramTypes .= 's';
            } else if(is_integer($value)){
                $paramTypes .= 'i';
            } else if(is_double($value)){
                $paramTypes .= 'd';
            } else {
                $paramTypes .= 'b';
            }
        }
        array_unshift($params, $paramTypes );
        //warning: wanted 2nd param to be a reference var, but complained when I made it a reference var.  Shut up, warning.  TODO: why?
        @call_user_func_array([$statement, 'bind_param'], $params);
        $statementResult = $statement->execute();
        if(substr($query, 0, 6) === 'SELECT'){
            return $statement->get_result(); 
        }
    
        return $statement;
    }
}

if(!function_exists('get_body_data')){
    function get_body_data( $parseJson = false ){
        $stdin = file_get_contents("php://input");
        if($parseJson){
            $data = json_decode($stdin);
        } else {
            parse_str($stdin,$data);
        }
        return $data;
    }
}

if(!function_exists('get_rights_data')){
    function get_rights_data($id){
        global $db;
        $id = intval($id);
        if(empty($id)){
            throw new Exception("invalid id");
        }
        $query = "SELECT rights FROM users WHERE id = $id";
        $result = $db->query($query);
        if(!$result){
            throw new Exception("Error with rights query:" . $db->error);
        }
        if($result->num_rows===0){
            throw new Exception("cannot find user id $id");
        }
        return $result->fetch_assoc()['rights'];
    }
}


?>