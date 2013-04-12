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
 * Expose assign
 */
module.exports = exports = assign;

function assign(name, settings, user, done) {

  // The feature has been enabled for everyone
  if(settings === true) {
    if(!exports.silent) console.info("*** Feature '"+name+"' has been turned on by default. Please remove it from your code. ***");
    debug("enabled");
    return done(null, true);
  }

  // TODO pass us the deserialized value so we can check to see if it's outdated

  // The rest require that the settings be an array
  if(type(settings) !== 'array') {
    debug("disabled");
    return done(null, false);
  }

  var id = exports.getUserId(user);

  // this user is a member of a group
  inGroup(id, settings, function(err, variant) {
    debug("group", err, variant);
    if (err || variant) return done(err, variant);

    // user falls in a weighting group
    inWeight(id, settings, function(err, variant) {
      debug("weight", err, variant);
      if (err || variant) return done(err, variant);

      // We didn't get anthing; try looking for a default. Otherwise send a false.
      variant = findDefault(settings);
      debug("default", variant);
      done(null, variant);
    });
  });
};

exports.getUserId = function(user) {
  return user.id;
};

exports.silent = false;

function inGroup(id, groups, done) {
  var variant = find(groups, function(variant) {
    return variant.group && ~variant.group.indexOf(id);
  });

  done(null, (variant||{}).value);
};

function inWeight(id, weights, done) {
  // Sum up all of the weights
  var total = sum(weights, 'weight');

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

function findDefault (list) {
  return (find(list, {"default": true}) || {}).value || false;
}

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
