exports.DONE = 0; // Started and successfully finished
// Abnormal exits -- which are program-specific -- start at 1

// Exit by signal returns 128 + signal number
//   e.g. Ctrl-C -> SIGINT (#2) -> exit code 130
// "Didn't start fully" codes start from 127 and go down
exports.NOT_FOUND = 127;
exports.CANT_EXEC = 126; // e.g. permission issue
exports.INVALID_CONFIG = 125; // fails one or more preconditions
exports.PARTIAL_START = 124; // app did not reach ready state
exports.DIED_DIRTY = 123; // did not complete cleanup when done
