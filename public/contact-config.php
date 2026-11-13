<?php
// Contact form settings. EDIT the three marked values, nothing else.
// 1. In cPanel, open "Email Accounts" and create a mailbox for this
//    website, for example website@your-domain.com
// 2. Put that mailbox address in 'smtp_user' and its password in
//    'smtp_pass' below.
// 3. 'to_email' is the inbox that receives the enquiries.
return [
    'smtp_host'   => 'localhost',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',
    'smtp_user'   => '', // <-- the cPanel mailbox address you created
    'smtp_pass'   => '', // <-- that mailbox's password
    'from_name'   => 'Bodhisattva Exhibition Website',
    'to_email'    => 'sanzeeprae@gmail.com', // <-- enquiries go here (testing address; change to the client's email later)
];
