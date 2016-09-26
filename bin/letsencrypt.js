#!/usr/bin/env node
'use strict';

var cli = require('cli');
var mkdirp = require('mkdirp');

cli.parse({
  email: [ false, " Email used for registration and recovery contact. (default: null)", 'email' ]
, domains: [ false, " Domain names to apply. For multiple domains you can enter a comma separated list of domains as a parameter. (default: [])", 'string' ]
, duplicate: [ false, " Allow getting a certificate that duplicates an existing one", 'boolean', false ]
, 'agree-tos': [ false, " Agree to the Let's Encrypt Subscriber Agreement", 'boolean', false ]
, debug: [ false, " show traces and logs", 'boolean', false ]
, 'tls-sni-01-port': [ false, " Use TLS-SNI-01 challenge type with this port (only port 443 is valid with most production servers) (default: 443,5001)", 'string' ]
, 'http-01-port': [ false, " Use HTTP-01 challenge type with this port (only port 80 is valid with most production servers) (default: 80)", 'string' ]
, 'dns-01': [ false, " Use DNS-01 challange type", 'boolean', false ]
, 'rsa-key-size': [ false, " Size (in bits) of the RSA key.", 'int', 2048 ]
, 'cert-path': [ false, " Path to where new cert.pem is saved", 'string',':configDir/live/:hostname/cert.pem' ]
, 'fullchain-path': [ false, " Path to where new fullchain.pem (cert + chain) is saved", 'string', ':configDir/live/:hostname/fullchain.pem' ]
, 'chain-path': [ false, " Path to where new chain.pem is saved", 'string', ':configDir/live/:hostname/chain.pem' ]
, 'domain-key-path': [ false, " Path to privkey.pem to use for domain (default: generate new)", 'string' ]
, 'account-key-path': [ false, " Path to privkey.pem to use for account (default: generate new)", 'string' ]
, 'config-dir': [ false, " Configuration directory.", 'string', '~/letsencrypt/etc/' ]
, server: [ false, " ACME Directory Resource URI.", 'string', '' ]
, standalone: [ false, " Obtain certs using a \"standalone\" webserver.", 'boolean', false ]
, manual: [ false, " Print the token and key to the screen and wait for you to hit enter, giving you time to copy it somewhere before continuing (default: false)", 'boolean', false ]
, webroot: [ false, " Obtain certs by placing files in a webroot directory.", 'boolean', false ]
, 'webroot-path': [ false, " public_html / webroot path.", 'string' ]
//, 'standalone-supported-challenges': [ false, " Supported challenges, order preferences are randomly chosen. (default: http-01,tls-sni-01)", 'string', 'http-01,tls-sni-01']
, 'work-dir': [ false, "(ignored)", 'string', '~/letsencrypt/var/lib/' ]
, 'logs-dir': [ false, "(ignored)", 'string', '~/letsencrypt/var/log/' ]
, 'ftp-url': [ false, "(ignored)", 'string', '' ]
, 'ftp-username': [ false, "(ignored)", 'string', '' ]
, 'ftp-password': [ false, "(ignored)", 'string', '' ]
, 'ftp-filepath-remoteroot': [ false, "(ignored)", 'string', '' ]
});

// ignore certonly and extraneous arguments
cli.main(function(_, options) {
  console.log('');
  var args = {};
  var homedir = require('homedir')();

  Object.keys(options).forEach(function (key) {
    var val = options[key];

    //console.log('key', key);
    //console.log('val', val);

    if ('string' === typeof val) {
      val = val.replace(/^~/, homedir);
    }

    key = key.replace(/\-([a-z0-9A-Z])/g, function (c) { return c[1].toUpperCase(); });
    args[key] = val;
  });

  Object.keys(args).forEach(function (key) {
    var val = args[key];

    if ('string' === typeof val) {
      val = val.replace(/(\:configDir)|(\:config)/, args.configDir);
    }

    args[key] = val;
  });

  if (args.domains) {
    args.domains = args.domains.split(',');
  }

  if (!(Array.isArray(args.domains) && args.domains.length) || !args.email || !args.agreeTos) {
    console.error("\nUsage: qsletsencrypt certonly --standalone --domains example.com --email user@example.com --agree-tos");
    console.error("\nSee letsencrypt --help for more details\n");
    return;
  }

  if (args.tlsSni01Port) {
    // [@agnat]: Coerce to string. cli returns a number although we request a string.
    args.tlsSni01Port = "" + args.tlsSni01Port;
    args.tlsSni01Port = args.tlsSni01Port.split(',').map(function (port) {
      return parseInt(port, 10);
    });
  }

  if (args.http01Port) {
    // [@agnat]: Coerce to string. cli returns a number although we request a string.
    args.http01Port = "" + args.http01Port;
    args.http01Port = args.http01Port.split(',').map(function (port) {
      return parseInt(port, 10);
    });
  }

  mkdirp(args.configDir, function (err) {
    if (err) {
      console.error("Could not create --config-dir '" + args.configDir + "':", err.code);
      console.error("Try setting --config-dir '/tmp'");
      return;
    }

    //console.log('args', args);
    //return;

    require('../').run(args);
  });
});
