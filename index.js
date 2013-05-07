/**
 * Module dependencies
 */
require = require("require-component")(require);

var HashRing = require("hashring")
  , find = require("find")
  , debug = require("debug")("pivot:assign");

function noop() {};

/**
 * Expose assign
 */
module.exports = function(options) {
  options = options || {};

  var userLookup = options.userLookup || function(user) { return user ? user.id : undefined; }
    , silent = options.silent || false;

  return function assign(config, user, done) {
    var name = config.name
    done = done || noop;

    // Enable every feature
    if(options.enableAll) {
      debug("All enabled","'"+name+"' using '"+config.target+"'");
      return done(null, config.target);
    }

    // The feature has been deprecated
    if(config.deprecated) {
      if(!silent) console.info("*** Feature '"+name+"' has been deprecated with the target variant '"+config.target+"'. ***");
      debug("Feature '"+name+"' deprecated");
      return done(null, config.target);
    }

    // The feature has been disabled
    if(!config.enabled) {
      debug("Feature '"+name+"' disabled");
      debug("Assigning control:",config.control)
      return done(null, config.control);
    }

    // TODO pass us the deserialized value so we can check to see if it's outdated or it has been overriden

    var id = userLookup(user)
      , groups = config.groups;

    // this user is in a list
    inGroup(id, groups, function(err, variant) {
      debug("group", err, variant);
      if (err || variant) return done(err, variant);

      // user falls in a weighting group
      inWeight(id, groups, function(err, variant) {
        debug("weight", err, variant);
        if (err || variant) return done(err, variant);

        // We didn't get anthing; return the control.
        variant = config.control;
        debug("control", variant);
        done(null, variant);
      });
    });
  };
};

function inGroup(id, groups, done) {
  var group = find(groups, function(group) {
    return group.users && ~group.users.indexOf(id);
  });

  done(null, (group||{}).value);
};

function inWeight(id, groups, done) {
  // We can't do anything since we want this to be consistent
  if(!id) return done();

  // Setup the hashring config with the various weights
  var config = {};
  groups.forEach(function(group) {
    // If it's been set to 0 disable it
    if(group.weight === 0) return;

    config[group.value] = typeof group.weight === "undefined" ? 1 : group.weight;
  });

  // TODO come up with a solution that will work with component
  // TODO this thing should probably be cached so we aren't running the hash every request
  var ring = new HashRing(config);
  done(null, ring.get(id));
};
