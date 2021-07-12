package play.policy
default permit = false

permit {
    role = ["manager" , "admin"]
    roles := input.user.roles
    roles[_] == role[_]
}

