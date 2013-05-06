/**
 * Module dependencies
 */
require = require("require-component")(require);

var HashRing = require("hashring")
  , find = require("find")
  , debug = require("debug")("pivot:assign");

/**
 * Expose assign
 */
module.exports = function(options) {
  options = options || {};

  var userLookup = options.userLookup || function(user) { return user ? user.id : undefined; }
    , silent = options.silent || false;

  return function assign(name, config, user, done) {

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
      , variants = config.variants;

    // this user is in a list
    inGroup(id, variants, function(err, variant) {
      debug("group", err, variant);
      if (err || variant) return done(err, variant);

      // user falls in a weighting group
      inWeight(id, variants, function(err, variant) {
        debug("weight", err, variant);
        if (err || variant) return done(err, variant);

        // We didn't get anthing; try looking for a control. Otherwise return the first.
        variant = config.control || variants[0];
        debug("control", variant);
        done(null, variant);
      });
    });
  };
};

function inGroup(id, variants, done) {
  var variant = find(variants, function(variant) {
    return variant.users && ~variant.users.indexOf(id);
  });

  done(null, (variant||{}).value);
};

function inWeight(id, variants, done) {
  // We can't do anything since we want this to be consistent
  if(!id) return done();

  // Setup the hashring config with the various weights
  var config = {};
  variants.forEach(function(variant) {
    // If it's been set to 0 disable it
    if(variant.weight === 0) return;
    
    config[variant.value] = typeof variant.weight === "undefined" ? 1 : variant.weight;
  });

  // TODO come up with a solution that will work with component
  // TODO this thing should probably be cached so we aren't running the hash every request
  var ring = new HashRing(config);
  done(null, ring.get(id));
};
