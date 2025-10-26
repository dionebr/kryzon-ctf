<?php
session_start();

// Database connection
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'shadowmere_user';
$db_pass = getenv('DB_PASS') ?: 'weak_password123';
$db_name = getenv('DB_NAME') ?: 'shadowmere_db';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    // Create SQLite fallback for standalone container
    $pdo = new PDO('sqlite:/tmp/shadowmere.db');
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user'
    )");
    
    // Insert default users
    $pdo->exec("INSERT OR IGNORE INTO users (id, username, password, role) VALUES 
        (1, 'admin', 'sup3r_s3cur3_p4ssw0rd', 'admin'),
        (2, 'guest', 'guest123', 'user'),
        (3, 'wizard', 'magic_spell_2023', 'user')
    ");
}

$message = '';

// Handle login
if ($_POST['action'] === 'login') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    // Vulnerable SQL query - intentionally not using prepared statements
    $query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
    
    try {
        $result = $pdo->query($query);
        $user = $result->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $_SESSION['user'] = $user;
            $message = '<div class="alert alert-success">Login successful! Welcome, ' . htmlspecialchars($user['username']) . '!</div>';
        } else {
            $message = '<div class="alert alert-danger">Invalid username or password!</div>';
        }
    } catch (PDOException $e) {
        $message = '<div class="alert alert-danger">Database error: ' . $e->getMessage() . '</div>';
    }
}

// Handle logout
if ($_GET['action'] === 'logout') {
    session_destroy();
    header('Location: /');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shadowmere - Magical Artifacts Store</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            color: #fff;
            min-height: 100vh;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        }
        .navbar-brand {
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .magic-text {
            text-shadow: 0 0 10px #4dabf7;
        }
        .admin-panel {
            background: linear-gradient(45deg, #2d1b4e, #1e3a8a);
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-dark bg-dark">
        <div class="container">
            <span class="navbar-brand magic-text">🏰 Shadowmere - Magical Artifacts</span>
            <?php if (isset($_SESSION['user'])): ?>
                <div>
                    Welcome, <?php echo htmlspecialchars($_SESSION['user']['username']); ?>! 
                    <a href="?action=logout" class="btn btn-outline-light btn-sm">Logout</a>
                </div>
            <?php endif; ?>
        </div>
    </nav>

    <div class="container mt-4">
        <?php echo $message; ?>
        
        <?php if (!isset($_SESSION['user'])): ?>
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h4>🔮 Magical Portal Access</h4>
                        </div>
                        <div class="card-body">
                            <form method="POST">
                                <input type="hidden" name="action" value="login">
                                <div class="mb-3">
                                    <label class="form-label">Username:</label>
                                    <input type="text" name="username" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Password:</label>
                                    <input type="password" name="password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">🗝️ Enter Portal</button>
                            </form>
                            <div class="mt-3">
                                <small class="text-muted">
                                    <strong>Hint:</strong> Try some common authentication bypasses... 
                                    Sometimes the simplest approaches work best! 😉
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h4>🏪 Artifact Gallery</h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h5>🗡️ Enchanted Sword</h5>
                                            <p>+10 Damage, Glowing Rune</p>
                                            <strong>500 Gold</strong>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h5>🛡️ Shield of Warding</h5>
                                            <p>+15 Defense, Magic Resistance</p>
                                            <strong>750 Gold</strong>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <h5>🔮 Crystal Orb</h5>
                                            <p>+20 Mana, Spell Focus</p>
                                            <strong>1000 Gold</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5>👤 User Profile</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Username:</strong> <?php echo htmlspecialchars($_SESSION['user']['username']); ?></p>
                            <p><strong>Role:</strong> <?php echo htmlspecialchars($_SESSION['user']['role']); ?></p>
                            <p><strong>ID:</strong> <?php echo htmlspecialchars($_SESSION['user']['id']); ?></p>
                        </div>
                    </div>
                </div>
            </div>

            <?php if ($_SESSION['user']['role'] === 'admin'): ?>
                <div class="admin-panel">
                    <h3>🔐 Admin Control Panel</h3>
                    <div class="alert alert-success">
                        <h4>🎉 Congratulations!</h4>
                        <p>You've successfully bypassed the authentication and gained admin access!</p>
                        <div class="flag-container" style="background: #000; padding: 15px; border-radius: 5px; font-family: monospace; margin-top: 15px;">
                            <strong style="color: #00ff00;">FLAG: KRYZON{sh4dow_sqli_byp4ss_m4st3r}</strong>
                        </div>
                        <p class="mt-3"><small>This vulnerability was caused by improper input sanitization in SQL queries. Always use prepared statements!</small></p>
                    </div>
                    
                    <div class="row mt-4">
                        <div class="col-md-6">
                            <h5>📊 Store Statistics</h5>
                            <ul>
                                <li>Total Products: 42</li>
                                <li>Active Users: 1,337</li>
                                <li>Daily Revenue: 5,000 Gold</li>
                                <li>Magic Level: Over 9000!</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h5>🔧 Admin Actions</h5>
                            <button class="btn btn-warning mb-2 w-100">Manage Inventory</button>
                            <button class="btn btn-info mb-2 w-100">View User Logs</button>
                            <button class="btn btn-danger mb-2 w-100">System Settings</button>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>

    <footer class="mt-5 py-3 bg-dark">
        <div class="container text-center">
            <small>&copy; 2024 Shadowmere Magical Artifacts - <span class="text-muted">A Kryzon CTF Challenge</span></small>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>