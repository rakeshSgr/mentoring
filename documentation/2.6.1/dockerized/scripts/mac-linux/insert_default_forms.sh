#!/bin/bash

# Exit on error
set -e

# Define the GitHub raw URL for the JSON file
GITHUB_REPO="https://raw.githubusercontent.com/ELEVATE-Project/mentoring-mobile-app/refs/heads/release-3.1.0/forms.json"
JSON_FILE="forms.json"  # The name to save the downloaded file

# Check if the organization_id is passed as an argument, otherwise use 'default_org'
if [ -z "$1" ]; then
    organization_id="default_org"
else
    organization_id="$1"
fi

# Check if the output directory is passed as an argument, otherwise use the current directory
if [ -z "$2" ]; then
    OUTPUT_DIR="."
else
    OUTPUT_DIR="$2"
fi

# Ensure the directory exists
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "Error: Directory '$OUTPUT_DIR' does not exist."
    exit 1
fi

# Define the output file path in the specified directory
SQL_OUTPUT_FILE="$OUTPUT_DIR/forms.sql"

# Fetch the JSON file from the GitHub repository
echo "Fetching JSON file from GitHub..."
curl -o $JSON_FILE $GITHUB_REPO

# Check if the download was successful
if [ $? -ne 0 ]; then
    echo "Failed to download JSON file from GitHub."
    exit 1
fi

# Create or overwrite the SQL output file
echo "Generating SQL insert statements..."
echo "" > $SQL_OUTPUT_FILE

# Initialize ID counter starting from 1
id_counter=1

# Use grep and sed to extract type, sub_type, and data fields
while read -r line; do
  # Extract type field
  if echo "$line" | grep -q '"type"'; then
    type=$(echo "$line" | sed -E 's/.*"type": *"([^"]+)".*/\1/')
  fi

  # Extract sub_type field
  if echo "$line" | grep -q '"sub_type"'; then
    sub_type=$(echo "$line" | sed -E 's/.*"sub_type": *"([^"]+)".*/\1/')
  fi

  # Extract the value of the data field (without including the "data" key itself)
  if echo "$line" | grep -q '"data"'; then
    data=$(sed -n '/"data": {/,/\}\}/p' $JSON_FILE | sed '1d;$d' | tr '\n' ' ' | sed 's/\"/\\\"/g')
  fi

  # Check if we have extracted enough fields to insert
  if [[ -n "$type" && -n "$sub_type" && -n "$data" ]]; then
    # Default version is set to 1
    version=1

    # Write the SQL insert statement to the output file
    echo "INSERT INTO forms (id, type, sub_type, data, version, organization_id) VALUES ($id_counter, '$type', '$sub_type', '{$data}', $version, '$organization_id');" >> $SQL_OUTPUT_FILE

    # Increment the ID counter for the next record
    id_counter=$((id_counter + 1))

    # Reset fields for the next record
    type=""
    sub_type=""
    data=""
  fi
done < $JSON_FILE

# Append 'SELECT NULL;' to the end of the SQL file
echo "SELECT NULL;" >> $SQL_OUTPUT_FILE

echo "SQL file generated: $SQL_OUTPUT_FILE"
