<?php
// Contact form settings. EDIT the three marked values, nothing else.
//
// SECURE PLACEMENT: put this file one folder ABOVE public_html (in
// the account home folder) - the form handler finds it there
// automatically, and no browser can ever reach it. Keeping it beside
// contact.php also works (the .htaccess file blocks web access to
// it), but above the web root is the safest place.
//
// The form sends from info@bodhisattvainternational.com to itself:
// the mailbox emails each enquiry to its own inbox.
// ONLY ONE value to fill in: the password of the
// info@bodhisattvainternational.com mailbox, in 'smtp_pass' below.
return [
    'smtp_host'   => 'localhost',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',
    'smtp_user'   => 'info@bodhisattvainternational.com', // the mailbox that sends (and receives)
    'smtp_pass'   => '', // <-- PASSWORD of info@bodhisattvainternational.com - fill this in
    'from_name'   => 'Bodhisattva Exhibition Website',
    'to_email'    => 'info@bodhisattvainternational.com', // <-- enquiries are delivered here
];
