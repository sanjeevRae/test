<?php
// Contact form settings. EDIT the three marked values, nothing else.
//
// SECURE PLACEMENT: put this file one folder ABOVE public_html (in
// the account home folder) - the form handler finds it there
// automatically, and no browser can ever reach it. Keeping it beside
// contact.php also works (the .htaccess file blocks web access to
// it), but above the web root is the safest place.
//
// The form sends FROM website@bodhisattvainternational.com (a
// mailbox created only for this website) TO
// info@bodhisattvainternational.com, where the enquiries are read.
// ONLY ONE value to fill in: the password you chose when creating
// the website@ mailbox, in 'smtp_pass' below.
return [
    'smtp_host'   => 'localhost',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',
    'smtp_user'   => 'website@bodhisattvainternational.com', // the sending mailbox (created for this website)
    'smtp_pass'   => '', // <-- PASSWORD of website@bodhisattvainternational.com - fill this in
    'from_name'   => 'Bodhisattva Exhibition Website',
    'to_email'    => 'info@bodhisattvainternational.com', // <-- enquiries are delivered here
];
