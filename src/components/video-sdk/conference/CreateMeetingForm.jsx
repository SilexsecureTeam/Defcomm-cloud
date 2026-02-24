import { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import AddUsersToMeeting from "../../dashboard/AddUsersToMeeting";
import { onFailure } from "../../../utils/notifications/OnFailure";
import {
  extractErrorMessage,
  formatDateTimeForBackend,
  formatDateTimeForInput,
} from "../../../utils/formmaters";
import { createMeeting } from "../Api";
import { MeetingContext } from "../../../context/MeetingContext";
import GroupSelectorModal from "../../dashboard/GroupSelectorModal";
import useConference from "../../../hooks/useConference";
import HeaderBar from "./HeaderBar";
import Spinner from "../../common/Spinner";
import Modal from "../../modal/Modal";

const CreateMeetingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location?.state?.data || null;
  const isEditing = !!editData;

  const { createMeetingMutation, updateMeetingMutation } = useConference();

  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    clearErrors,
  } = useForm({
    defaultValues: {
      meeting_id: "",
      subject: "",
      title: "",
      agenda: "",
      startdatetime: "",
      group_user_id: "",
    },
  });

  useEffect(() => {
    if (isEditing && editData) {
      reset({
        meeting_id: editData.meeting_id || "",
        subject: editData.subject || "",
        title: editData.title || "",
        agenda: editData.agenda || "",
        startdatetime: formatDateTimeForInput(editData?.startdatetime) || "",
        group_user_id: editData.group_user_id || "",
      });

      if (editData.group) {
        setSelectedGroup({
          group_id: editData.group_user_id,
          group_name: editData.group?.group_name || "Selected Group",
        });
      }
    }
  }, [isEditing, editData, reset]);

  const generateMeetingId = async () => {
    setIsGeneratingId(true);
    try {
      const randomId = await createMeeting();
      setValue("meeting_id", randomId, { shouldValidate: true });
    } catch (e) {
      onFailure({ message: "Failed to generate ID" });
    } finally {
      setIsGeneratingId(false);
    }
  };

  const onCreateMeeting = (data) => {
    setIsCreatingMeeting(true);

    const payload = isEditing
      ? {
          id: editData?.id,
          ...data,
          startdatetime: formatDateTimeForBackend(data.startdatetime),
        }
      : {
          ...data,
          meeting_link: "https://cloud.defcomm.ng/dashboard/conference/waiting",
          group_user_id: selectedGroup?.group_id || null,
          group_user: selectedGroup ? "group" : "user",
          users: selectedUsers,
          startdatetime: formatDateTimeForBackend(data.startdatetime),
        };

    const mutation = isEditing
      ? updateMeetingMutation.mutate
      : createMeetingMutation.mutate;

    mutation(payload, {
      onSuccess: () => {
        reset();
        navigate("/dashboard/conference/my-meetings", { replace: true });
      },
      onError: (error) => {
        onFailure({
          message: isEditing ? "Update Failed" : "Creation Failed",
          error: extractErrorMessage(error),
        });
        setIsCreatingMeeting(false);
      },
    });
  };

  return (
    <div>
      <HeaderBar />
      <form
        onSubmit={handleSubmit(onCreateMeeting)}
        className="w-full text-white my-5"
      >
        <h2 className="text-2xl font-semibold mb-6 text-[#A7C957]">
          {isEditing ? "Update Meeting" : "Create a New Meeting"}
        </h2>

        {["title", "subject", "agenda"].map((field) => (
          <div key={field}>
            <label className="block mb-1 font-semibold capitalize text-[#A7C957]">
              {field}
            </label>
            <input
              type="text"
              placeholder={field}
              {...register(field, { required: `${field} is required` })}
              className="p-3 border border-[#4e6220] bg-[#1A1A1A] rounded-md w-full mb-3 text-gray-200 placeholder:text-gray-400 focus:border-[#A7C957] outline-none transition-all"
            />
            {errors[field] && (
              <p className="text-red-500 mb-3">{errors[field].message}</p>
            )}
          </div>
        ))}

        {/* Start Datetime */}
        <label className="block mb-1 font-semibold text-[#A7C957]">
          Start Date & Time
        </label>
        <input
          type="datetime-local"
          {...register("startdatetime", {
            required: "Start datetime is required",
          })}
          className="p-3 border border-[#4e6220] bg-[#1A1A1A] rounded-md w-full mb-3 text-gray-200 placeholder:text-gray-400 focus:border-[#A7C957] outline-none transition-all"
        />
        {errors.startdatetime && (
          <p className="text-red-500 mb-3">{errors.startdatetime.message}</p>
        )}

        {/* Group Selection */}
        {!isEditing && (
          <>
            <label className="block mb-1 font-semibold text-[#A7C957]">
              Select Group
            </label>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                disabled={isEditing || selectedUsers.length > 0}
                onClick={() => setIsGroupModalOpen(true)}
                className="px-3 py-2 bg-[#5C7C2A] rounded-md hover:bg-[#4e6220] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedGroup?.group_name || "Choose Group"}
              </button>
              <button
                type="button"
                disabled={isEditing || selectedGroup}
                onClick={() => setIsUserModalOpen(true)}
                className="px-3 py-2 bg-[#5C7C2A] rounded-md hover:bg-[#4e6220] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedUsers?.length
                  ? `${selectedUsers.length} Selected`
                  : "Select Users"}
              </button>
            </div>

            {/* Conditional Validation: Group OR Users */}
            <input
              type="hidden"
              {...register("group_user_id", {
                validate: (value) => {
                  if (value) return true; // group selected OR users marker set
                  return "Group or Users is required";
                },
              })}
            />

            {errors.group_user_id && (
              <p className="text-red-500 mb-3">
                {errors.group_user_id.message}
              </p>
            )}
          </>
        )}

        {/* Meeting ID */}
        <div className="flex justify-between items-center mb-1">
          <label className="font-semibold text-[#A7C957]">Meeting ID</label>
          <button
            type="button"
            onClick={generateMeetingId}
            disabled={isGeneratingId}
            className="text-sm bg-[#5C7C2A] px-3 py-1 rounded-md hover:bg-[#4e6220] flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingId ? (
              <>
                <Spinner size="text-sm" />
                Generating...
              </>
            ) : (
              "Generate ID"
            )}
          </button>
        </div>

        <input
          type="text"
          placeholder="Meeting ID"
          {...register("meeting_id", { required: "Meeting ID is required" })}
          className="p-3 border border-gray-600 bg-[#1A1A1A] rounded-md w-full mb-3 text-gray-200 placeholder:text-gray-400 focus:border-[#5C7C2A] outline-none transition-all"
        />

        {errors.meeting_id && (
          <p className="text-red-500 mb-3">{errors.meeting_id.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isCreatingMeeting}
          className="w-full bg-[#5C7C2A] p-3 rounded-md font-semibold hover:bg-[#4e6220] disabled:opacity-60 flex justify-center items-center gap-2 transition-all duration-200"
        >
          {isCreatingMeeting ? (
            <>
              <Spinner size="text-sm" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEditing ? "Update Meeting" : "Create Meeting"}</>
          )}
        </button>
      </form>

      {/* Group Modal */}
      <GroupSelectorModal
        selectedGroup={selectedGroup}
        onSelectGroup={(group) => {
          setSelectedGroup(group);
          setValue("group_user_id", group?.group_id, {
            shouldValidate: true,
          });
          clearErrors("group_user_id");
        }}
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />

      {/* User Modal */}
      <Modal
        title="Select Users"
        isOpen={isUserModalOpen}
        closeModal={() => setIsUserModalOpen(false)}
      >
        <AddUsersToMeeting
          mode="data"
          onSelectUsers={(users) => {
            setSelectedUsers(users);
            setValue("group_user_id", "users", { shouldValidate: true });
            clearErrors("group_user_id");
          }}
          onClose={() => setIsUserModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default CreateMeetingForm;
