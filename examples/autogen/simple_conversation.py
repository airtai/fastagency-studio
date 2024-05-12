from autogen import AssistantAgent
import openai
import os

api_key = os.getenv("AZURE_OPENAI_API_KEY") # use France or Canada
api_base = os.getenv("AZURE_API_ENDPOINT")
gpt_3_5_model_name = os.getenv("AZURE_GPT35_MODEL") # "gpt-35-turbo-16k"

openai.api_type = "azure"
openai.api_version = os.getenv("AZURE_API_VERSION") # "2024-02-15-preview"

config_list = [{
    "model": gpt_3_5_model_name,
    "api_key": api_key,
    "base_url": api_base,
    "api_type": openai.api_type,
    "api_version": openai.api_version,
}]

llm_config = {
    "config_list": config_list,
    "temperature": 0,
}


def chat_with_weatherman(message):

    weather_man = AssistantAgent(
        "weather_man",
        system_message="You are the weather man. When the user asks you about the weather, randomly answer with a weather forecast.",
        llm_config=llm_config,
    )

    user_system_message = f"""You are the user interested in the weather forecast.
    Ask the weather_man one question at the time.

    1. question:
    What is the weather like today?

    2. question:
    What is the weather forecast for tomorrow?

    Once you have asked both questions, end the conversation by writing 'TERMINATE'
    """
    user = AssistantAgent(
        "user",
        system_message=user_system_message,
        llm_config=llm_config,
    )

    chat_result = user.initiate_chat(recipient=weather_man, message=message)
    return chat_result


if __name__ == "__main__":
    chat_result = chat_with_weatherman(message="What is the weather like today?")
    print(chat_result)
    for c in chat_result.chat_history:
        print(c)
        print(type(c))
