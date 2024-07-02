## Create EntityTypes And Entities From CSVs - Developer Guide

This guide explains how to use the 'createEntitiesAndTypes.js' script to upload data from CSV files to the mentoring service via its API. The script prompts for necessary inputs, processes CSV files, and creates corresponding entities on the platform.

### Prerequisites

1. **Node.js**: Ensure Node.js is installed. Download from [Node.js](https://nodejs.org/).
2. **CSV Files**: Place the CSV files in the same directory as the script.

### Directory Structure

Place your script and CSV files in the same directory:

```
/project-directory
  - createEntitiesAndTypes.js
  - competencies.csv
  - designation.csv
```

### CSV Filename Expectations

-   **Filename Usage**: The script uses the CSV filename (excluding the `.csv` extension) to create an `entityType` in the mentoring service.
-   **Entity Type Creation**: The filename will be processed to generate the entity type's `value` and `label`. For instance:
    -   `competencies.csv` will create an entity type with:
        -   `value`: `competencies`
        -   `label`: `Competencies`
    -   `designation.csv` will create an entity type with:
        -   `value`: `designation`
        -   `label`: `Designation`
-   **Entities**: Each entity from the CSV file will be added under this entity type.

### CSV Content Expectations

-   **Columns**: The CSV should have `identifier` and `entity` columns.
    -   `identifier`: The unique identifier for each entity.
    -   `entity`: The name or label of the entity.

Example CSV content:

**competencies.csv**

```
identifier,entity
001,Communication
002,Leadership
003,Problem Solving
```

**designation.csv**

```
identifier,entity
101,Manager
102,Engineer
103,Analyst
```

### Running the Script

1. **Set Up**: Ensure your CSV files are in the correct directory and have the expected format.
2. **Run**: Execute the script using Node.js.
    ```bash
    node createEntitiesAndTypes.js
    ```
3. **Follow Prompts**: The script will prompt for:
    - The domain of the mentoring platform.
    - An access token for authentication.
    - Selection of a CSV file to process.
    - Model names for the entity type.

### Script Workflow

1. **Domain Prompt**: Enter the domain for the mentoring platform (or press Enter for the default).
2. **Access Token**: Enter the access token.
3. **CSV File Selection**: Choose a CSV file from the listed files.
4. **Model Names**: Provide space-separated database model names.
5. **Entity Type Creation**: The script creates an entity type based on the CSV filename.
6. **Entity Creation**: The script processes each row in the CSV and creates corresponding entities in the mentoring service.
7. **Repeat or Exit**: After processing a CSV file, you can choose another file or exit.

### Error Handling

The script includes error handling for:

-   Directory reading issues.
-   Invalid CSV file selection.
-   API request failures with retries for entity creation.

By following this guide, you can efficiently upload your CSV data to the mentoring service, creating structured entity types and entities based on your file content and names.
