'use strict';

var LE = require('letsencrypt');

module.exports.run = function (args) {
  var leChallenge;
  var leStore;
  var servers;
  var USE_DNS = {};

  var challengeType;
  if (args.dns01) {
    challengeType = 'dns-01';
    args.webrootPath = '';
    args.standalone = USE_DNS;
  } else if (args.tlsSni01Port) {
    challengeType = 'tls-sni-01';
  } else /*if (args.http01Port)*/ {
    challengeType = 'http-01';
  }

  if (args.manual) {
    leChallenge = require('qs-le-challenge-manual').create({
        ftpUrl: args.ftpUrl,
      ftpUsername: args.ftpUsername,
      ftpPassword: args.ftpPassword,
      ftpFilepathRemoteroot: args.ftpFilepathRemoteroot
    });
  }
  else if (args.webrootPath) {
    // webrootPath is all that really matters here
    // TODO rename le-challenge-fs to le-challenge-webroot
    leChallenge = require('./lib/webroot').create({ webrootPath: args.webrootPath });
  }
  else if (USE_DNS !== args.standalone) {
    leChallenge = require('le-challenge-standalone').create({});
    servers = require('./lib/servers').create(leChallenge).startServers(
      args.http01Port || [80], args.tlsSni01Port || [443, 5001]
    , { debug: args.debug }
    );
  }

  leStore = require('le-store-certbot').create({
    configDir: args.configDir
  , privkeyPath: args.domainKeyPath || ':configDir/live/:hostname/privkey.pem' //args.privkeyPath
  , fullchainPath: args.fullchainPath
  , certPath: args.certPath
  , chainPath: args.chainPath
  , webrootPath: args.webrootPath
  , domainKeyPath: args.domainKeyPath
  , accountKeyPath: args.accountKeyPath
  });

  if (!args.server) {
    throw new Error("You must specify a server to use with --server");
  }

  // let LE know that we're handling standalone / webroot here
  var le = LE.create({
    debug: args.debug
  , server: args.server
  , store: leStore
  , challenges: { 'http-01': leChallenge, 'tls-sni-01': leChallenge }
  , duplicate: args.duplicate
  });

  // Note: can't use args directly as null values will overwrite template values
  le.register({
    domains: args.domains
  , email: args.email
  , agreeTos: args.agreeTos
  , challengeType: challengeType
  , rsaKeySize: args.rsaKeySize
  }).then(function (certs) {
    if (servers) {
      servers.closeServers();
    }

    // should get back account, path to certs, pems, etc?
    console.log('\nCertificates installed at:');
    console.log(Object.keys(args).filter(function (key) {
      return /Path/.test(key);
    }).map(function (key) {
      return args[key];
    }).join('\n').replace(/:hostname/, args.domains[0]));

    console.log("");
    console.log("Got certificate(s) for " + certs.altnames.join(', '));
    console.log("\tIssued at " + new Date(certs.issuedAt).toISOString() + "");
    console.log("\tValid until " + new Date(certs.expiresAt).toISOString() + "");
    console.log("");

    process.exit(0);
  }, function (err) {
    console.error('[Error]: letsencrypt-cli');
    console.error(err.stack || new Error('get stack').stack);

    process.exit(1);
  });

};
