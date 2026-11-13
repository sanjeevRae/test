<?php
// Contact form settings. EDIT the three marked values, nothing else.
//
// SECURE PLACEMENT: put this file one folder ABOVE public_html (in
// the account home folder) - the form handler finds it there
// automatically, and no browser can ever reach it. Keeping it beside
// contact.php also works (the .htaccess file blocks web access to
// it), but above the web root is the safest place.
//
// 1. In cPanel, open "Email Accounts" and create a mailbox only for
//    sending, for example website@bodhisattvainternational.com
// 2. Put that mailbox address in 'smtp_user' and its password in
//    'smtp_pass' below.
// 3. 'to_email' is the inbox that receives the enquiries.
return [
    'smtp_host'   => 'localhost',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',
    'smtp_user'   => '', // <-- the sending mailbox, e.g. website@bodhisattvainternational.com
    'smtp_pass'   => '', // <-- that mailbox's password
    'from_name'   => 'Bodhisattva Exhibition Website',
    'to_email'    => 'info@bodhisattvainternational.com', // <-- enquiries are delivered here
];
