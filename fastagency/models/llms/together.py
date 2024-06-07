from typing import Annotated, Any, Dict, Literal
from uuid import UUID

from pydantic import AfterValidator, Field, HttpUrl
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import register

__all__ = [
    "TogetherAIAPIKey",
    "TogetherAI",
]

TogetherModels: TypeAlias = Literal[
    "01.AI Yi Chat (34B)",
    "Allen AI OLMo Instruct (7B)",
    "Allen AI OLMo Twin-2T (7B)",
    "Allen AI OLMo (7B)",
    "Austism Chronos Hermes (13B)",
    "cognitivecomputations Dolphin 2.5 Mixtral 8x7b",
    "databricks DBRX Instruct",
    "DeepSeek Deepseek Coder Instruct (33B)",
    "DeepSeek DeepSeek LLM Chat (67B)",
    "garage-bAInd Platypus2 Instruct (70B)",
    "Google Gemma Instruct (2B)",
    "Google Gemma Instruct (7B)",
    "Gryphe MythoMax-L2 (13B)",
    "LM Sys Vicuna v1.5 (13B)",
    "LM Sys Vicuna v1.5 (7B)",
    "Meta Code Llama Instruct (13B)",
    "Meta Code Llama Instruct (34B)",
    "Meta Code Llama Instruct (70B)",
    "Meta Code Llama Instruct (7B)",
    "Meta LLaMA-2 Chat (70B)",
    "Meta LLaMA-2 Chat (13B)",
    "Meta LLaMA-2 Chat (7B)",
    "Meta LLaMA-3 Chat (8B)",
    "Meta LLaMA-3 Chat (70B)",
    "mistralai Mistral (7B) Instruct",
    "mistralai Mistral (7B) Instruct v0.2",
    "mistralai Mistral (7B) Instruct v0.3",
    "mistralai Mixtral-8x7B Instruct (46.7B)",
    "mistralai Mixtral-8x22B Instruct (141B)",
    "NousResearch Nous Capybara v1.9 (7B)",
    "NousResearch Nous Hermes 2 - Mistral DPO (7B)",
    "NousResearch Nous Hermes 2 - Mixtral 8x7B-DPO (46.7B)",
    "NousResearch Nous Hermes 2 - Mixtral 8x7B-SFT (46.7B)",
    "NousResearch Nous Hermes LLaMA-2 (7B)",
    "NousResearch Nous Hermes Llama-2 (13B)",
    "NousResearch Nous Hermes-2 Yi (34B)",
    "OpenChat OpenChat 3.5 (7B)",
    "OpenOrca OpenOrca Mistral (7B) 8K",
    "Qwen Qwen 1.5 Chat (0.5B)",
    "Qwen Qwen 1.5 Chat (1.8B)",
    "Qwen Qwen 1.5 Chat (4B)",
    "Qwen Qwen 1.5 Chat (7B)",
    "Qwen Qwen 1.5 Chat (14B)",
    "Qwen Qwen 1.5 Chat (32B)",
    "Qwen Qwen 1.5 Chat (72B)",
    "Qwen Qwen 1.5 Chat (110B)",
    "Snorkel AI Snorkel Mistral PairRM DPO (7B)",
    "Snowflake Snowflake Arctic Instruct",
    "Stanford Alpaca (7B)",
    "Teknium OpenHermes-2-Mistral (7B)",
    "Teknium OpenHermes-2.5-Mistral (7B)",
    "Together LLaMA-2-7B-32K-Instruct (7B)",
    "Together RedPajama-INCITE Chat (3B)",
    "Together RedPajama-INCITE Chat (7B)",
    "Together StripedHyena Nous (7B)",
    "Undi95 ReMM SLERP L2 (13B)",
    "Undi95 Toppy M (7B)",
    "WizardLM WizardLM v1.2 (13B)",
    "upstage Upstage SOLAR Instruct v1 (11B)",
]

together_model_string: Dict[TogetherModels, str] = {
    "01.AI Yi Chat (34B)": "01AI_Yi_Chat_34B",
    "Allen AI OLMo Instruct (7B)": "Allen_AI_OLMo_Instruct_7B",
    "Allen AI OLMo Twin-2T (7B)": "Allen_AI_OLMo_Twin_2T_7B",
    "Allen AI OLMo (7B)": "Allen_AI_OLMo_7B",
    "Austism Chronos Hermes (13B)": "Austism_Chronos_Hermes_13B",
    "cognitivecomputations Dolphin 2.5 Mixtral 8x7b": "cognitivecomputations_Dolphin_2_5_Mixtral_8x7b",
    "databricks DBRX Instruct": "databricks_DBRX_Instruct",
    "DeepSeek Deepseek Coder Instruct (33B)": "DeepSeek_Deepseek_Coder_Instruct_33B",
    "DeepSeek DeepSeek LLM Chat (67B)": "DeepSeek_DeepSeek_LLM_Chat_67B",
    "garage-bAInd Platypus2 Instruct (70B)": "garage_bAInd_Platypus2_Instruct_70B",
    "Google Gemma Instruct (2B)": "Google_Gemma_Instruct_2B",
    "Google Gemma Instruct (7B)": "Google_Gemma_Instruct_7B",
    "Gryphe MythoMax-L2 (13B)": "Gryphe_MythoMax_L2_13B",
    "LM Sys Vicuna v1.5 (13B)": "LM_Sys_Vicuna_v1_5_13B",
    "LM Sys Vicuna v1.5 (7B)": "LM_Sys_Vicuna_v1_5_7B",
    "Meta Code Llama Instruct (13B)": "Meta_Code_Llama_Instruct_13B",
    "Meta Code Llama Instruct (34B)": "Meta_Code_Llama_Instruct_34B",
    "Meta Code Llama Instruct (70B)": "Meta_Code_Llama_Instruct_70B",
    "Meta Code Llama Instruct (7B)": "Meta_Code_Llama_Instruct_7B",
    "Meta LLaMA-2 Chat (70B)": "Meta_LLaMA_2_Chat_70B",
    "Meta LLaMA-2 Chat (13B)": "Meta_LLaMA_2_Chat_13B",
    "Meta LLaMA-2 Chat (7B)": "Meta_LLaMA_2_Chat_7B",
    "Meta LLaMA-3 Chat (8B)": "Meta_LLaMA_3_Chat_8B",
    "Meta LLaMA-3 Chat (70B)": "Meta_LLaMA_3_Chat_70B",
    "mistralai Mistral (7B) Instruct": "mistralai_Mistral_7B_Instruct",
    "mistralai Mistral (7B) Instruct v0.2": "mistralai_Mistral_7B_Instruct_v0_2",
    "mistralai Mistral (7B) Instruct v0.3": "mistralai_Mistral_7B_Instruct_v0_3",
    "mistralai Mixtral-8x7B Instruct (46.7B)": "mistralai_Mixtral_8x7B_Instruct_46_7B",
    "mistralai Mixtral-8x22B Instruct (141B)": "mistralai_Mixtral_8x22B_Instruct_141B",
    "NousResearch Nous Capybara v1.9 (7B)": "NousResearch_Nous_Capybara_v1_9_7B",
    "NousResearch Nous Hermes 2 - Mistral DPO (7B)": "NousResearch_Nous_Hermes_2_Mistral_DPO_7B",
    "NousResearch Nous Hermes 2 - Mixtral 8x7B-DPO (46.7B)": "NousResearch_Nous_Hermes_2_Mixtral_8x7B_DPO_46_7B",
    "NousResearch Nous Hermes 2 - Mixtral 8x7B-SFT (46.7B)": "NousResearch_Nous_Hermes_2_Mixtral_8x7B_SFT_46_7B",
    "NousResearch Nous Hermes LLaMA-2 (7B)": "NousResearch_Nous_Hermes_LLaMA_2_7B",
    "NousResearch Nous Hermes Llama-2 (13B)": "NousResearch_Nous_Hermes_Llama_2_13B",
    "NousResearch Nous Hermes-2 Yi (34B)": "NousResearch_Nous_Hermes_2_Yi_34B",
    "OpenChat OpenChat 3.5 (7B)": "OpenChat_OpenChat_3_5_7B",
    "OpenOrca OpenOrca Mistral (7B) 8K": "OpenOrca_OpenOrca_Mistral_7B_8K",
    "Qwen Qwen 1.5 Chat (0.5B)": "Qwen_Qwen_1_5_Chat_0_5B",
    "Qwen Qwen 1.5 Chat (1.8B)": "Qwen_Qwen_1_5_Chat_1_8B",
    "Qwen Qwen 1.5 Chat (4B)": "Qwen_Qwen_1_5_Chat_4B",
    "Qwen Qwen 1.5 Chat (7B)": "Qwen_Qwen_1_5_Chat_7B",
    "Qwen Qwen 1.5 Chat (14B)": "Qwen_Qwen_1_5_Chat_14B",
    "Qwen Qwen 1.5 Chat (32B)": "Qwen_Qwen_1_5_Chat_32B",
    "Qwen Qwen 1.5 Chat (72B)": "Qwen_Qwen_1_5_Chat_72B",
    "Qwen Qwen 1.5 Chat (110B)": "Qwen_Qwen_1_5_Chat_110B",
    "Snorkel AI Snorkel Mistral PairRM DPO (7B)": "Snorkel_AI_Snorkel_Mistral_PairRM_DPO_7B",
    "Snowflake Snowflake Arctic Instruct": "Snowflake_Snowflake_Arctic_Instruct",
    "Stanford Alpaca (7B)": "Stanford_Alpaca_7B",
    "Teknium OpenHermes-2-Mistral (7B)": "Teknium_OpenHermes_2_Mistral_7B",
    "Teknium OpenHermes-2.5-Mistral (7B)": "Teknium_OpenHermes_2_5_Mistral_7B",
    "Together LLaMA-2-7B-32K-Instruct (7B)": "Together_LLaMA_2_7B_32K_Instruct_7B",
    "Together RedPajama-INCITE Chat (3B)": "Together_RedPajama_INCITE_Chat_3B",
    "Together RedPajama-INCITE Chat (7B)": "Together_RedPajama_INCITE_Chat_7B",
    "Together StripedHyena Nous (7B)": "Together_StripedHyena_Nous_7B",
    "Undi95 ReMM SLERP L2 (13B)": "Undi95_ReMM_SLERP_L2_13B",
    "Undi95 Toppy M (7B)": "Undi95_Toppy_M_7B",
    "WizardLM WizardLM v1.2 (13B)": "WizardLM_WizardLM_v1_2_13B",
    "upstage Upstage SOLAR Instruct v1 (11B)": "upstage_Upstage_SOLAR_Instruct_v1_11B",
}


@register("secret")
class TogetherAIAPIKey(Model):
    api_key: Annotated[
        str,
        Field(
            description="The API Key from Together.ai",
            min_length=64,
            max_length=64,
        ),
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model: TogetherAIAPIKey = await cls.from_db(model_id)

        return my_model.api_key


TogetherAIAPIKeyRef: TypeAlias = TogetherAIAPIKey.get_reference_model()  # type: ignore[valid-type]

# Pydantic adds trailing slash automatically to URLs, so we need to remove it
# https://github.com/pydantic/pydantic/issues/7186#issuecomment-1691594032
URL = Annotated[HttpUrl, AfterValidator(lambda x: str(x).rstrip("/"))]


@register("llm")
class TogetherAI(Model):
    model: Annotated[  # type: ignore[valid-type]
        TogetherModels,
        Field(description="The model to use for the Together API"),
    ] = "Meta LLaMA-3 Chat (70B)"

    api_key: TogetherAIAPIKeyRef

    base_url: Annotated[URL, Field(description="The base URL of the OpenAI API")] = URL(
        url="https://api.together.xyz/v1"
    )

    api_type: Annotated[
        Literal["togetherai"],
        Field(
            title="API Type", description="The type of the API, must be 'togetherai'"
        ),
    ] = "togetherai"

    temperature: Annotated[
        float,
        Field(
            description="The temperature to use for the model, must be between 0 and 2",
            ge=0.0,
            le=2.0,
        ),
    ] = 0.8

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Dict[str, Any]:
        my_model: TogetherAI = await cls.from_db(model_id)

        api_key_model: TogetherAIAPIKey = (
            await my_model.api_key.get_data_model().from_db(my_model.api_key.uuid)
        )

        api_key = await api_key_model.create_autogen(my_model.api_key.uuid, user_id)

        config_list = [
            {
                "model": together_model_string[my_model.model],
                "api_key": api_key,
                "base_url": str(my_model.base_url),
                "api_type": my_model.api_type,
            }
        ]

        llm_config = {
            "config_list": config_list,
            "temperature": my_model.temperature,
        }

        return llm_config
