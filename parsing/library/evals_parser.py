from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import requests
import getpass
import os
import json
import time
from tqdm import tqdm

# Variable
year = 2023
input_file = ""  # Specify file name here, or use an empty string to download data from the Semesterly course API
output_file = "{}/parsing/schools/jhu/data/evals.json".format(os.getcwd())

# Get email and password from user input
jhu_email = input("Enter your JHU email: ")
jhu_password = getpass.getpass("Enter your JHU password: ")

# Config
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument("--no-sandbox")  # Allow running chrome as root in Docker
chrome_options.add_argument("--headless")  # Do not require a display
chrome_options.add_argument("--disable-dev-shm-usage")  # for docker
chrome_options.add_argument("--window-size=1920x1080")

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

# Load courses
if input_file:
    with open(input_file, "r") as file:
        courses = json.load(file)
else:
    response = requests.get("https://jhu.semester.ly/courses/json")
    courses = response.json()

# Open the URL
url = "https://asen-jhu.evaluationkit.com/"
driver.get(url)

# Authentication starts here
# Wait for the email input field and enter the email
email_input = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "i0116"))
)
email_input.send_keys(jhu_email)

# Wait for the next button to be clickable and click it
next_button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "idSIButton9"))
)
next_button.click()

# Wait for the password input field and enter the password
password_input = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "i0118"))
)
password_input.send_keys(jhu_password)

time.sleep(1)

# Wait for the sign-in button to be clickable and click it
sign_in_button = WebDriverWait(driver, 10).until(
    EC.element_to_be_clickable((By.ID, "idSIButton9"))
)
sign_in_button.click()

# Start to parse evaluations on courses
course_ratings = {}

# Dictionary to convert semester codes to full names
semester_conversion = {
    "FA": "Fall",
    "SP": "Spring",
    "SU": "Summer",
    "IN": "Intersession",
}

print(f"Total number of courses to parse: {len(courses)}")

# Parse course evaluations
with tqdm(total=len(courses), desc="Parsing Courses", unit="course") as pbar:
    for course in courses:
        course_name = course["name"]
        course_code = course["code"]

        # Construct the URL based on the course_name or course_code as needed
        course_url = (
            f"https://asen-jhu.evaluationkit.com/Report/Public/Results?"
            f"Course={course_name}&Instructor=&TermId=&Year={year}"
            f"&AreaId=&QuestionKey=&Search=true"
        )
        driver.get(course_url)

        try:
            # Continuously click on "Show more results" link while it exists
            while True:
                try:
                    show_more_link = WebDriverWait(driver, 0.1).until(
                        EC.presence_of_element_located((By.ID, "publicMore"))
                    )
                    show_more_link.click()
                    time.sleep(5)
                except:
                    break

            # After expanding all results, locate all courses
            class_elements = driver.find_elements(
                By.CLASS_NAME, "sr-dataitem-info-code"
            )

            if class_elements:
                # For each located course element, parse the required information
                for element in class_elements:
                    class_info = element.text

                    # Split and parse the course code and semester/year
                    (
                        course_code_with_section_parsed,
                        semester_and_year_parsed,
                    ) = class_info.rsplit(".", 1)

                    # Check if the parsed course code matches the one we're interested in
                    if course_code in course_code_with_section_parsed:
                        # Find the parent element which includes both instructor name and rating
                        parent_div = element.find_element(By.XPATH, "./..")

                        try:
                            # Attempt to extract the instructor name from the parent div
                            professor_name_element = parent_div.find_element(
                                By.CLASS_NAME, "sr-dataitem-info-instr"
                            )
                            professor_name = professor_name_element.text
                        except Exception:
                            # If the element is not found, set professor name as empty
                            professor_name = ""

                        rating_element = element.find_element(
                            By.XPATH, "../following-sibling::div//strong"
                        )
                        rating = float(rating_element.text)

                        # Organize the data in a dictionary
                        if course_code not in course_ratings:
                            course_ratings[course_code] = {}
                        if semester_and_year_parsed not in course_ratings[course_code]:
                            course_ratings[course_code][semester_and_year_parsed] = {}
                        if (
                            professor_name
                            not in course_ratings[course_code][semester_and_year_parsed]
                        ):
                            course_ratings[course_code][semester_and_year_parsed][
                                professor_name
                            ] = []

                        # Append the rating to the list for the specific course, semester/year, and professor
                        course_ratings[course_code][semester_and_year_parsed][
                            professor_name
                        ].append(rating)

                # print(f"Successfully parsed evaluations for course {course_code}")

            else:
                # print(f"No evaluations found for course {course_code}.")
                pass

        except Exception as e:
            print(f"Exception raised with error: {e}.")

        pbar.update(1)

# Format the collected data and write it to a JSON file
formatted_courses = []
with tqdm(
    total=len(course_ratings.items()), desc="Formatting Parsed Courses", unit="course"
) as pbar:
    for course_code, semesters in course_ratings.items():
        for semester_and_year, professors in semesters.items():
            for professor_name, ratings in professors.items():
                average_rating = sum(ratings) / len(ratings)

                # Format the semester and year
                term, year = semester_and_year[:2], semester_and_year[2:]
                term_full = semester_conversion.get(term, "Unknown Term")
                year_full = f"20{year}"

                # Format the professor's name
                formatted_professor_name = " ".join(
                    word.strip().capitalize()
                    for word in reversed(professor_name.split(","))
                )

                formatted_course = {
                    "course": {"code": course_code},
                    "instructors": [{"name": formatted_professor_name}],
                    "kind": "eval",
                    "score": round(average_rating, 2),
                    "summary": "",  # Empty
                    "term": term_full,
                    "year": term_full + ":" + year_full,
                }
                formatted_courses.append(formatted_course)
        pbar.update(1)

# Save the formatted data to a JSON file
with open(output_file, "w") as outfile:
    json.dump(
        {"$data": formatted_courses, "$meta": {"$schools": {"jhu": {}}}},
        outfile,
        indent=2,
    )

print(f"Course data formatted and saved to '{output_file}'.")
driver.quit()
