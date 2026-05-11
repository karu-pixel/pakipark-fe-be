const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for backend validation
);

/**
 * Protect routes — verify Supabase JWT and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }

    // Map Supabase user to our request object
    // Note: We might need to fetch additional profile data from our DB here if needed
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'customer',
      ...user,
    };
    req.user._id = user.id;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, unexpected error' });
  }
};

module.exports = { protect };
