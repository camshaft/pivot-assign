/**
 * Module dependencies
 */
require = require("require-component")(require);

var crypto = require("crypto")
  , type = require("type")
  , sum = require("sum")
  , find = require("find")
  , debug = require("debug")("pivot:assign")
  , debugW = require("debug")("pivot:assign:weight");

/**
 * Default user lookup
 */
var userLookup = function(user) {
  return user.id;
};

/**
 * Disables deprecation messages
 */
var silent = false;

/**
 * Expose assign
 */
module.exports = exports = assign;

function assign(name, config, user, done) {

  // The feature has been enabled for everyone
  if(config.deprecated) {
    if(!silent) console.info("*** Feature '"+name+"' has been deprecated. The default variant is now '"+config.default+"'. ***");
    debug("Feature '"+name+"' deprecated");
    return done(null, config.default);
  }

  // The feature has been disabled
  if(!config.enabled) {
    debug("Feature '"+name+"' disabled");
    return done(null, config.default);
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

      // We didn't get anthing; try looking for a default. Otherwise send a false.
      variant = config.default || false;
      debug("default", variant);
      done(null, variant);
    });
  });
};

exports.user = function(fn) {
  userLookup = fn;
};

exports.silent = function(val) {
  silent = typeof val === "undefined" ? true : val;
};

function inGroup(id, variants, done) {
  var variant = find(variants, function(variant) {
    return variant.users && ~variant.users.indexOf(id);
  });

  done(null, (variant||{}).value);
};

function inWeight(id, variants, done) {
  // Sum up all of the weights
  var total = sum(variants, 'weight');

  debugW("total",total);

  // We didn't have any weights
  if(!total) return done();

  // Figure out a position in the total
  var hash = generateHash(id)
    , position = (total * 100) % hash
    , max = 0;

  debugW("position",position,"hash",hash);

  var variant = find(function(variant) {
    return max < position < max += (variant.weight || 0);
  });

  done(null, (variant||{}).value);
};

/**
 * Generate a hash for a user id
 *
 * TODO come up with a solution that will work with component
 */
function generateHash(id){
  var hash = crypto.createHash('md5');
  hash.update(new Buffer(id));
  return hash.digest('hex');
};
