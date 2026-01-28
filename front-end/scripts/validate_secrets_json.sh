

set -xe

jq '
  (.users | map(.id) | group_by(.) | map(select(length > 1) | first)) as $dupes
  | if ($dupes | length) > 0
    then error("Duplicate user ids found: \($dupes | join(", "))")
    else "No duplicate ids found"
  end
' secrets.json