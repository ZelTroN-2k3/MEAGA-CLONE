<?php
// api/Router.php

class Router {
    private $routes = [
        'GET' => [],
        'POST' => []
    ];

    /**
     * Register a GET route
     */
    public function get($action, $handler) {
        $this->routes['GET'][$action] = $handler;
    }

    /**
     * Register a POST route
     */
    public function post($action, $handler) {
        $this->routes['POST'][$action] = $handler;
    }

    /**
     * Dispatch the request
     */
    public function dispatch() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        if (!isset($this->routes[$method])) {
            $this->sendError('Method Not Allowed', 405);
        }

        if (empty($action) || !isset($this->routes[$method][$action])) {
            $this->sendError('Invalid action.', 400);
        }

        $handler = $this->routes[$method][$action];

        // Parse input data for POST requests
        $data = [];
        if ($method === 'POST') {
            // Check if it's a multipart/form-data request (like file uploads)
            if (isset($_SERVER["CONTENT_TYPE"]) && strpos($_SERVER["CONTENT_TYPE"], "multipart/form-data") !== false) {
                $data = $_POST; // File uploads use $_POST and $_FILES
            } else {
                $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            }
        }

        try {
            call_user_func($handler, $data);
        } catch (Exception $e) {
            $this->sendError('Server error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Send error response
     */
    private function sendError($message, $statusCode) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => $message]);
        exit;
    }
}
